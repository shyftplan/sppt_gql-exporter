const fs = require('fs');
const path = require('path');
const { GraphQLClient } = require('graphql-request');
const {
  parse: parseCsv,
  transforms: { flatten },
} = require('json2csv');
const configDefaults = require('./config-defaults.json');

const basePath = process.env.DEVELOPMENT
  ? path.resolve(process.cwd())
  : path.dirname(process.execPath);

const getFile = (relativePath) =>
  fs.readFileSync(path.join(basePath, relativePath), 'utf8');

function enhanceConfigWithDefaults(config) {
  return { ...configDefaults, ...config };
}

function validateConfig(config) {
  const requiredFields = ['graphQlUrl', 'auth', 'companyId'];

  const missingFields = requiredFields.filter(
    (requiredField) => config[requiredField] === undefined,
  );

  if (missingFields.length) {
    console.error(
      `The config.json is missing following Fields: ${missingFields.join(
        ', ',
      )}`,
    );

    return false;
  }

  return true;
}

function getConfig() {
  const config = JSON.parse(getFile('config.json'));

  if (!validateConfig(config)) {
    return;
  }

  const enhancedConfig = enhanceConfigWithDefaults(config);

  return enhancedConfig;
}

async function getPage({ client, query, params, companyId, page }) {
  let response = {};

  try {
    response = await client.request(query, {
      ...params,
      page,
      companyId,
    });
  } catch (error) {
    console.error(`Failed to get page ${page} due to an error.`, error);
  }

  return response;
}

async function getAllPages({ client, query, params, companyId }) {
  const result = {};

  let page = 1;
  let currentResultLength = 0;
  let key;

  do {
    const response = await getPage({
      client,
      companyId,
      page,
      params,
      query,
    });

    page++;

    if (!key) {
      key = Object.keys(response)[0];
      result[key] = [];
    }

    currentResultLength = response[key].length;
    result[key].push(...response[key]);
  } while (currentResultLength);

  return result;
}

function saveResult(result, outputType = 'json') {
  const [[key, data]] = Object.entries(result);

  switch (outputType) {
    case 'csv': {
      saveCsv(data, key);
      break;
    }
    default: {
      console.warn(`Unknown output type ${outputType}. Will default to JSON.`);
    }
    // eslint-disable-next-line no-fallthrough
    case 'json': {
      saveJson(data, key);
    }
  }
}

function saveJson(result, filename = 'output') {
  fs.writeFile(`./${filename}.json`, JSON.stringify(result), function (err) {
    if (err) {
      console.error('An error occurred while saving output-file.', err);
      return;
    }

    console.log('The file was saved!');
  });
}

function saveCsv(result, filename = 'output') {
  fs.writeFile(
    `./${filename}.csv`,
    parseCsv(result, { transforms: [flatten({ arrays: true })] }),
    function (err) {
      if (err) {
        console.error('An error occurred while saving output-file.', err);
        return;
      }

      console.log('The file was saved!');
    },
  );
}

// TODO: Introduce Filter system
// function filterData(data, ...filters) {
//   return data.filter((entry) => filters.some((filter) => filter(entry)));
// }

// TODO: Introduce Filter system
// const deletedAtFilter = (entry) => !entry.deletedAt;

async function run() {
  const {
    graphQlUrl,
    graphQlParams,
    auth,
    companyId,
    outputType,
  } = getConfig();

  const graphQlClient = new GraphQLClient(graphQlUrl, {
    headers: {
      ...auth,
    },
  });

  const graphQlQuery = getFile('query.gql');
  const data = await getAllPages({
    client: graphQlClient,
    query: graphQlQuery,
    params: graphQlParams,
    companyId,
  });

  // TODO: Introduce Filter system
  // const filteredData = filterData(data); // TODO: Have this be extensible

  saveResult(data, outputType);
}

run();
