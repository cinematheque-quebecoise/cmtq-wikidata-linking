const request = require ('request')
const WBK = require('wikibase-sdk')
const util = require('util')
const config = require('../config')

const wbk = WBK({
  instance: config.CQ_INSTANCE,
  sparqlEndpoint: config.CQ_SPARQL_ENDPOINT
})

// Fetch links between CQ and Wikidata through CQ's SPARQL endpoint.
// Only links which are not already present in Wikidata will be fetched.
// @param n: First n links from CQ's unlinked data
// @return: List of CQ and Wikidata links
const getCQWDPersonslinks = async (entityLabel, limit) => {
  console.log("config: ", config)
  const labelQueryPart = entityLabel ? `?cqUri rdfs:label ${entityLabel} .` : ""
  let limitQueryPart = limit ? `LIMIT ${limit} .` : ""
  if (!entityLabel) {
    limitQueryPart = "LIMIT 1"
  }
  const query = `
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>
    PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>
    PREFIX owl: <http://www.w3.org/2002/07/owl#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    SELECT ?cqUri ?cqEntityId ?wdEntityId ?entityLabel WHERE {{
      ?cqUri a crm:E21_Person .
      ?cqUri rdfs:label ?entityLabel .
      ${labelQueryPart}
      ?cqUri crm:P48_has_preferred_identifier [ crm:P190_has_symbolic_content ?cqEntityId ] .
      BIND(xsd:string(?cqEntityId) as ?cqEntityIdStr)

      ?cqUri owl:sameAs ?wdUri .
      BIND(REPLACE(str(?wdUri), "http://www.wikidata.org/entity/", "", "i") AS ?wdEntityId)
      FILTER (contains(str(?wdUri), "http://www.wikidata.org/entity/"))

      MINUS {{
        SERVICE <https://query.wikidata.org/sparql> {{
          ?wdUri wdt:P8971 ?cqEntityIdStr
        }}
      }}
    }} ${limitQueryPart}
  `
  try {
    const options = {
      url: wdk.sparqlQuery(query),
      headers: {
      'User-Agent': 'Wikidata - CQ - Linking',
      'Content-Type' : 'application/x-www-form-urlencoded'
      }
    }
    const response = await util.promisify(request.get)(options)
    const data = response.body
    const simplifiedResults = wdk.simplify.sparqlResults(data, { minimize: true })
    return simplifiedResults
  } catch(err) {
    console.log("err: ", err)
    console.log("End of Get CQ films with multiple external ids")
    return undefined
  }
}

module.exports = () => {

  return {
    linkData: async(entityLabel, limit) => {
      console.log(`Fetching new links between Cinémathèque québécoise and Wikidata from ${CQ_SPARQL_ENDPOINT}...`)
      const cqWDPersonslinks = await getCQWDPersonslinks(entityLabel, limit)
      console.log("cqWDPersonslinks: ", cqWDPersonslinks)
    }
  }
}
