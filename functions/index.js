const functions = require('firebase-functions');
const serviceAccount = require('./serviceAccount.json');
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// const firestore = admin.firestore();
const {Firestore} = require('@google-cloud/firestore');
// Create a new client
const firestore = new Firestore();
const FieldValue = admin.firestore.FieldValue;

getCards = async () =>
  await firestore
    .collection('cards')
    .get()
    .then(querySnapshot => querySnapshot.docs)
    .then(docs => docs.map(doc => doc.data()))
    .catch(e => [] );

// const cards = getCards();

const cards = [
  {
    "title": "",
    "content": "The shuttle door has just been closed. As you buckle your safety harness and cycle through the pre-flight checklist, the magnitude of your first solo flight into space is weighing heavily. You’ve pre-programmed the in-flight stereo to blast one song as soon as the engines ignite for lift-off. What song do you blast off to?"
  },
  {
    "title": "",
    "content": "You seat yourself at the bar, hardly noticing the silence that has followed you in. Losing a passport deep in the heart of Mexico will do that to a person. 2 mescal shots later, you turn around because the uncomfortable stares from the locals have made the hairs on the back of your neck stand up. In walks the scariest man you have ever seen. He walks over to the Jukebox, drops in a few quarters and presses J-6. What song plays?"
  },
  {
    "title": "",
    "content": "It’s 3:05. Walking down the hallway, a crowd begins to form behind you and follow you out the parking lot, murmurs turning into cheers. You crank the song playing in your sport Walk-Man, because you know it’s time to kick that bully’s ass! What song do you play?"
  },
  {
    "title": "",
    "content": "Just when everything was going great, he/she walks in the door. You lock eyes. It’s been over a year since that one night during the summer. What song fades into the scene?"
  },
  {
    "title": "",
    "content": "Play the country song that best describes the totality of your senior year in high school."
  },
  {
    "title": "",
    "content": "Play the hip-hop song that best describes your first year of college."
  },
  {
    "title": "",
    "content": "Play the song you jammed to on the day you got your driver’s license?"
  }
];

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
  firestore.collection('openmatch').doc('lobby').set({
    players: FieldValue.arrayUnion('id'+Date.now())
  }, { merge: true });
});

exports.addPlayer2 = functions.https.onCall((data, context) => {
  console.log('addPlayer2', data);
  firestore.collection('openmatch').doc('lobby').set({
    players: FieldValue.arrayUnion('id'+Date.now())
  }, { merge: true });
});

// playerAddedToOpenmatch(data);

exports.playerAddedToOpenMatch = functions.firestore
  .document('openmatch/lobby')
  .onUpdate((change, context) => {
    console.log('openmatch/lobby onUpdate');
    // Only edit data when it is first created.
    // if (change.before.exists) {
    //   console.log('Only edit data when it is first created');
    //   return null;
    // }
    // Exit when the data is deleted.
    if (!change.after.exists) {
      console.log('Exit when the data is deleted.');
      return null;
    }

    const players = change.after.data().players;

    console.log('players: ', players);

    if (players.length >= 5) {
      createGameWithPlayers(players.slice(0, 5));
    }

    return null;
  });

  const createGameWithPlayers = players => {
    console.log('createGameWithPlayers');
    const gameRef = firestore.collection('card_games').doc();
    const gameId = gameRef.id;
    
    const batch = firestore.batch();
    const gameplayRef = gameRef.collection('gameplay');
    const totalRounds = 5;
    const randomCards = pickRandomCards(cards, totalRounds);
    console.log('randomCards', randomCards.length, players.length);

    batch.set(
      gameplayRef.doc('info'), 
      { currentRound: 1, players }
    );

    // create round data
    for (let i = 1; i <= totalRounds; i++) 
      batch.set(gameplayRef.doc(`round${i}`), { card: randomCards[i-1] });

    // delete playersIds
    players.forEach(id => 
      batch.update(
        firestore.collection('openmatch').doc('lobby'),
        { players: admin.firestore.FieldValue.arrayRemove(id) }
      )
    );

    batch.commit().then(() => console.log('createGameWithPlayers done')).catch(e => console.log('error createGameWithPlayers', e));
  }

  const pickRandomCards = (arr, count) =>
    arr.sort(() => 0.5 - Math.random()).slice(0, count)