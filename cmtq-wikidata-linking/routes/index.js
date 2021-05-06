
module.exports = (app, wikidataLinkerService) => {
  app.get('/', function(req, res, next) {
    wikidataLinkerService.linkData("", 2)
    res.render('index', { title: 'wikidata_cmtq_linking' });
  });
}

//https://gitlab.com/cinematheque-quebecoise/wikidata_cmtq_linking/-/blob/master/link_wikidata_cmtq.py
// Ajouter une page pour l'affichage des résultats, lancer le script
// Le script sera executé chaque jour vers minuit
// Parcourir la BD de la CQ
//        Pour chaque film / personne
//          Vérifier si il existe dans wikidata
//             Si oui, ne rien faire
//             Sinon :
//                - l'ajouter à wikidata, avec CQ external id
//                - Update film dans cq bd avec lien vers wikidata
//                - Ajouter un logging
