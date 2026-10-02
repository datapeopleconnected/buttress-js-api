/**
 * Buttress API - The federated real-time open data platform
 * Copyright (C) 2016-2024 Data People Connected LTD.
 * <https://www.dpc-ltd.com/>
 *
 * This file is part of Buttress.
 * Buttress is free software: you can redistribute it and/or modify it under the
 * terms of the GNU Affero General Public Licence as published by the Free Software
 * Foundation, either version 3 of the Licence, or (at your option) any later version.
 * Buttress is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public Licence for more details.
 * You should have received a copy of the GNU Affero General Public Licence along with
 * this program. If not, see <http://www.gnu.org/licenses/>.
 */
import assert from 'assert';

import Buttress from '../../dist/index';
import type {ButtressOptions} from '../../dist/index';

type SchemaObject = Record<string, any>;

// Tests init without a version and (once) with a non-array schema, which the options type does not allow
const options = (partial: Record<string, unknown>) => partial as unknown as ButtressOptions;

// createObject's path is optional at runtime, and it returns false when there is no schema
const createObject = (collection: string, path?: string) =>
  (Buttress.getCollection(collection) as unknown as {createObject(path?: string): SchemaObject}).createObject(path);

describe('Unit tests for index.js', () => {
  describe('Basic', () => {
    it('should call init and be initialised', async () => {
      try {
        await Buttress.init(
          options({
            schema: '[]',
            useLocalSchema: true,
          }),
        );
      } catch (err) {
        assert.fail(err as Error);
      }

      assert.strictEqual(Buttress.initialised, true);
    });

    it('should call clean and not be initialised', async () => {
      try {
        await Buttress.clean();
      } catch (err) {
        assert.fail(err as Error);
      }

      assert.strictEqual(Buttress.initialised, false);
    });
  });

  describe('_addModule', () => {
    const schemas = [
      {
        name: 'example',
        type: 'collection',
        properties: {
          name: {
            __type: 'string',
            __default: null,
          },
        },
      },
      {
        name: 'exampleSchema',
        type: 'collection',
        properties: {
          name: {
            __type: 'string',
            __default: null,
          },
        },
      },
      {
        name: 'exampleSchemaExample',
        type: 'collection',
        properties: {
          name: {
            __type: 'string',
            __default: null,
          },
        },
      },
      {
        name: 'organisation',
        type: 'collection',
        extends: ['timestamps'],
        properties: {
          name: {
            __type: 'string',
            __default: null,
            __required: true,
            __allowUpdate: true,
          },
          profile: {
            __type: 'string',
            __default: 'PRIVATE',
            __enum: ['PRIVATE', 'PUBLIC'],
            __required: true,
            __allowUpdate: true,
          },
          score: {
            __type: 'number',
            __default: 0,
            __required: true,
            __allowUpdate: true,
          },
          isActive: {
            __type: 'boolean',
            __default: false,
            __required: true,
            __allowUpdate: true,
          },
          array: {
            __type: 'array',
            __itemtype: 'string',
            __required: true,
            __allowUpdate: true,
          },
          companiesRegistrar: {
            __type: 'array',
            __required: true,
            __allowUpdate: true,
            __schema: {
              name: {
                __type: 'string',
                __default: null,
                __required: true,
                __allowUpdate: true,
              },
              registrarType: {
                __type: 'string',
                __default: 'REGISTRATION',
                __enum: ['REGISTRATION', 'TAXATION'],
                __required: true,
                __allowUpdate: true,
              },
              incorporatedOn: {
                __type: 'date',
                __default: null,
                __required: true,
                __allowUpdate: true,
              },
              numbers: {
                number1: {
                  __type: 'string',
                  __default: null,
                  __required: true,
                  __allowUpdate: true,
                },
                number2: {
                  __type: 'number',
                  __default: 0,
                  __required: true,
                  __allowUpdate: true,
                },
              },
            },
          },
          registeredAddress: {
            address1: {
              __type: 'string',
              __default: null,
              __required: true,
              __allowUpdate: true,
            },
            address2: {
              __type: 'date',
              __default: null,
              __required: true,
              __allowUpdate: true,
            },
            city: {
              __type: 'number',
              __default: 0,
              __required: true,
              __allowUpdate: true,
            },
            county: {
              __type: 'date',
              __default: null,
              __required: true,
              __allowUpdate: true,
            },
          },
        },
      },
    ];

    before(async function () {
      await Buttress.clean();

      await Buttress.init(
        options({
          schema: schemas,
          useLocalSchema: true,
        }),
      );
    });

    it('should have function _addModule', async () => {
      assert(typeof Buttress._addModule === 'function');
    });

    it(`check that modules are called 'example', 'exampleSchema' and 'exampleSchemaExample'`, async () => {
      const modules = (Buttress as unknown as {__modules: Record<string, {core?: boolean}>}).__modules;
      const names = Object.keys(modules).reduce<string[]>((arr, schemaName) => {
        if (modules[schemaName].core) return arr;

        arr.push(schemaName);
        return arr;
      }, []);

      assert(names.some((n) => n === 'example'));
      assert(names.some((n) => n === 'exampleSchema'));
      assert(names.some((n) => n === 'exampleSchemaExample'));
    });

    it(`should have function Buttress.getCollection.createObject`, async () => {
      assert(typeof Buttress.getCollection('organisation').createObject === 'function');
    });

    it(`validate createObject result with the schema object`, async () => {
      const company = createObject('organisation');
      const companyRegistrar = createObject('organisation', 'companiesRegistrar');
      assert(Object.keys(company).some((k) => k === 'name'));
      assert(Object.keys(company).some((k) => k === 'profile' && company[k] === 'PRIVATE'));
      assert(Object.keys(company).some((k) => k === 'score' && company[k] === 0));
      assert(Object.keys(company).some((k) => k === 'isActive' && !company[k]));
      assert(
        Object.keys(company).some(
          (k) => k === 'companiesRegistrar' && typeof company[k] === 'object' && Array.isArray(company[k]),
        ),
      );
      assert(Object.keys(company).some((k) => k === 'registeredAddress' && typeof company[k] === 'object'));
      assert(Object.keys(company['registeredAddress']).some((k) => k === 'address1'));
      assert(Object.keys(company['registeredAddress']).some((k) => k === 'address2'));
      assert(Object.keys(company['registeredAddress']).some((k) => k === 'city'));
      assert(Object.keys(company['registeredAddress']).some((k) => k === 'county'));

      assert(Object.keys(companyRegistrar).some((k) => k === 'name'));
      assert(
        Object.keys(companyRegistrar).some((k) => k === 'registrarType' && companyRegistrar[k] === 'REGISTRATION'),
      );
      assert(Object.keys(companyRegistrar).some((k) => k === 'incorporatedOn'));
      assert(Object.keys(companyRegistrar).some((k) => k === 'numbers'));
      assert(Object.keys(companyRegistrar['numbers']).some((k) => k === 'number1'));
      assert(Object.keys(companyRegistrar['numbers']).some((k) => k === 'number2'));
    });
  });
});
