const request = require('request')
const util = require('util')
const wdk = require('wikidata-sdk')
const wikibaseEdit = require('wikibase-edit')

// Sparl Queries
const queryCQFilms = `
SELECT DISTINCT ?item ?cqExternalID ?statement WHERE {
  ?item wdt:P4276 ?cqExternalID.
  ?item p:P4276 ?statement.
} Limit 2
`

const queryCQFilmsWithMultipleExternalIds = `
SELECT DISTINCT ?item ?cqExternalID ?cqExternalID2 ?statement WHERE {
  ?item wdt:P4276 ?cqExternalID.
  ?item wdt:P4276 ?cqExternalID2.
  ?item p:P4276 ?statement.
  FILTER(?cqExternalID != ?cqExternalID2).
} Limit 2
`

// Wikibase-edit config
const wikibaseEditConfig = {
  instance: 'https://www.wikidata.org',
  credentials: {
    username: 'Kabec20',
    password: 'p7qvQzykUaLV7k'
  },
  summary: 'Mise à jour de Cinémathèque québécoise work identifier',
  userAgent: 'modif-filmo-urls/v1.0.0 (https://gitlab.com/cinematheque-quebecoise/cmtq-wikidata-linking)'
}
const wbEdit = wikibaseEdit(wikibaseEditConfig)

// Get CQ films with multiple external id
const getCQFilmsWithMultipleExternalID = async () => {
  console.log('Get CQ films with multiple external ids')
  try {
    const options = {
      url: wdk.sparqlQuery(queryCQFilmsWithMultipleExternalIds),
      headers: {
        'User-Agent': 'Mise à jour de Cinémathèque québécoise work identifier',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
    const response = await util.promisify(request.get)(options)
    const data = response.body
    const simplifiedResults = wdk.simplify.sparqlResults(data, { minimize: true })
    console.log('End of Get CQ films with multiple external ids')
    return simplifiedResults
  } catch (err) {
    console.log('err: ', err)
    console.log('End of Get CQ films with multiple external ids')
    return undefined
  }
}

// Remove multiple External ID for a single film
const removeAllExternalId = async (film) => {
  const guid = film.statement
  const response = await wbEdit.claim.remove({ guid })
  if (response.success === 1) {
    console.log(`Remove External ID for : ${film.item} ........ SUCCESS`)
  } else {
    console.log(`Remove External ID for : ${film.item} ........ ERROR`)
  }
  return response
}

// Remove CQ films multiple External ID with wikibase-edit
const removeCQFilmsMultiplesExternalId = async () => {
  console.log('Remove CQ films multiple External ID...........................')
  const films = await getCQFilmsWithMultipleExternalID()
  if (films) {
    await Promise.all(films.map(async (film) => removeAllExternalId(film)))
  }
  console.log('End of Remove CQ films multiple External ID.................')
}

// Get CQ films with wikidata-sdk
const getCQFilms = async () => {
  console.log('Get CQ films with wikidata-sdk')
  try {
    const options = {
      url: wdk.sparqlQuery(queryCQFilms),
      headers: {
        'User-Agent': 'Mise à jour de Cinémathèque québécoise work identifier',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
    const response = await util.promisify(request.get)(options)
    const data = response.body
    const simplifiedResults = wdk.simplify.sparqlResults(data, { minimize: true })
    console.log('End of Get CQ films with wikidata-sdk')
    return simplifiedResults
  } catch (err) {
    console.log('err: ', err)
    console.log('End of Get CQ films with wikidata-sdk')
    return undefined
  }
}

// Update External ID for a single film
const updateExternalId = async (film) => {
  const guid = film.statement
  const removeRes = await wbEdit.claim.remove({ guid })
  if (removeRes.success === 1) {
    console.log(`Remove External ID for : ${film.item} ........ SUCCESS`)
    const createRes = await wbEdit.claim.create({
      id: film.item,
      property: 'P4276',
      value: film.cqExternalID
    })

    if (createRes.success === 1) {
      console.log(`Update External ID for : ${film.item} ........ SUCCESS`)
    } else {
      console.log(`Update External ID for : ${film.item} ........ ERROR`)
    }
    return { claimType: 'create', response: createRes }
  }

  console.log(`Remove External ID for : ${film.item} ........ ERRROR`)
  return { claimType: 'remove', response: removeRes }
}

// Update CQ films External ID with wikibase-edit
const updateCQFilmsExternalId = async () => {
  console.log('Update CQ films External ID...........................')
  const films = await getCQFilms()
  await Promise.all(films.map(async (film) => updateExternalId(film)))
  console.log('End of Update CQ films External ID.................')
}

const execute = async () => {
  // Delete multiple external id
  await removeCQFilmsMultiplesExternalId()

  // Update external id
  // await updateCQFilmsExternalId()
}

// Execute script
execute()
