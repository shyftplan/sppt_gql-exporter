# sppt_gql-exporter
A little tool which helps querying and automatically does the paging fo you

## Basic usage
1. To use it, copy the binary for your OS from the bin folder to some place you like. 
1. Create a file named `config.json` in the same folder.
It should look like this:
```json
{
  "graphQlUrl": "https://graphql.example.com",
  "companyId": 1,
  "auth": {
    "authemail": "user@shyftplan.com",
    "authtoken": "sHyFtPlAnLoGiNtOkEn"
  }
}
```

3. Replace the url, the companyId and the authentication fields with the values you want to use.
4. Create a file called `query.gql` in the same folder
   You can then write the paged query you want to run. It should look similar to this
```graphql
query (
  $companyId: Int!
  $perPage: Int = 200
  $page: Int = 1
) {
  employments(
    companyId: $companyId, 
    perPage: $perPage, 
    page: $page, 
  ) {
    id
    firstName
    lastName
  }
}
```
The naming for `companyId`, `perPage` and `page` has to be exactly like here. (Check if the endpoint you want to query supports this filters)

5. now you can run the query by opening a terminal in this folder and running `./index-[your os]`. If everything worked fine, you'll see `The file was saved!`, and there'll be a file created named like the endpoint you queried + .json. (Would be `employments.json` for the upper example).

## Adding custom filters to the query

You can add other filters to the query, like following: 

**settings.json**
```json
  "graphQlParams": {
    "fieldToQuery": "queryValue"
  }
```

**query.gql**
```graphql
query(
    # [...]
    $fieldToQuery: String
    # [...]
) {
  employments(
  # [...]
  fieldToQuery: $fieldToQuery
  # [...]
  ) {
  # [...]
  }
}
```

## Exporting CSV

To export a `*.csv` file instead of a `*.json` file, just add `"outputType": "csv"` to your **settings.json**. Right now `json` and `csv` are the only supported settings.
