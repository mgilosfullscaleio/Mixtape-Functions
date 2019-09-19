const functions = require('firebase-functions');
const serviceAccount = require('./serviceAccount.json');
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

getCards = async () =>
  await firestore
    .collection('cards')
    .get()
    .then(querySnapshot => querySnapshot.docs)
    .then(docs => docs.map(doc => doc.data()))
    .catch(e => [] );

const cards = getCards();

/*
  {
    players: [
      'player1',
      'player2',
      'player3',
      'player4',
      'player5',
      'player6',
    ]
  }

*/
// exports.addPlayer = functions.https.onCall((data, context) => {
exports.addPlayer = functions.https.onRequest((req, res) => {
  console.log('addPlayer');
  firestore.collection('openMatch').doc('lobby').update({
    players: admin.firestore.FieldValue.arrayUnion('id'+Date.now())
  });
});

exports.addPlayer2 = functions.https.onCall((data, context) => {
  console.log('addPlayer2', data);
  firestore.collection('openMatch').doc('lobby').update({
    players: admin.firestore.FieldValue.arrayUnion('id'+Date.now())
  });
});

const data = {after:{players: ['player1', 'player2', 'player3', 'player4', 'player5']}};

// playerAddedToOpenMatch(data);

exports.playerAddedToOpenMatch = functions.firestore
  .document('openMatch/lobby')
  .onUpdate((change, context) => {
    console.log('openMatch/lobby onUpdate');
    // Only edit data when it is first created.
    if (change.before.exists) {
      console.log('Only edit data when it is first created');
      return null;
    }
    // Exit when the data is deleted.
    if (!change.after.exists) {
      console.log('Exit when the data is deleted.');
      return null;
    }

    const players = change.after.data().players;

    console.log('players: ', players);

    if (players.length === 5) {
      createGameWithPlayers(players);
    }

    return null;
  });

  const createGameWithPlayers = players => {
    console.log('createGameWithPlayers');
    const gameRef = firestore.collection('card_games').doc();
    const gameId = gameRef.id;

    const gameplayRef = gameRef.collection('gameplay');
    const totalRounds = 5;
    const randomCards = pickRandomCards(cards, totalRounds);
    const batch = firestore.batch();

    batch.set(gameplayRef.doc('info'), {
      currentRound: 1,
      players
    });

    for (let i = 1; i === totalRounds; i++)
      batch.set(gameplayRef.doc(`round${i}`), { card: randomCards[i-1] });

    batch.commit();
  }

  const pickRandomCards = (arr, count) =>
    arr.sort(() => 0.5 - Math.random()).slice(0, count)