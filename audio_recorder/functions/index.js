// Copyright 2019, Google, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

"use strict";

// Import the Dialogflow module from the Actions on Google client library.
// https://github.com/actions-on-google/actions-on-google-nodejs
const { dialogflow } = require("actions-on-google");
// Import the firebase-functions package for Cloud Functions for Firebase fulfillment.
const functions = require("firebase-functions");
const speech = require('@google-cloud/speech');
const fs = require('fs');
const cors = require('cors')({origin: true});

const admin = require("firebase-admin");

var serviceAccount = require("./healthcare-assitant-kxgfmk-firebase-adminsdk-3q8lq-047d0d801a");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://healthcare-assitant-kxgfmk.firebaseio.com"
});
const db = admin.firestore();


// Instantiate the Dialogflow client with debug logging enabled.
const app = dialogflow({
  debug: true
});

const INTRO_SOUND =
  "https://storage.googleapis.com/actionsresources/Set2_Intro1.wav";
const OUTRO_SOUND =
  "https://storage.googleapis.com/actionsresources/Set2_Outro1.wav";

// Initialize Cloud Firestore through Firebase


// Default intent for handling the start of the action
app.intent("Default Welcome Intent", conv => {
  console.log(`Welcome: ${conv.user.last.seen}`);
  return db
    .collection("files")
    .orderBy("timestamp", "desc")
    .limit(1)
    .get()
    .then(snapshot => {
      if (snapshot.size > 0) {
        conv.close(`<speak>
          <par>
            <media xml:id="intro">
              <speak>Welcome to the Audio Demo. Here's the latest recording:</speak>
            </media>
            <media xml:id="introSound" begin="intro.end+0.5s" soundLevel="5dB" fadeOutDur="1.0s">
              <audio
                src="${INTRO_SOUND}"/>
            </media>
            <media xml:id="recording" begin="introSound.end+0.5s">
              <audio
                src="${snapshot.docs[0].data().url.replace(/&/g, "&#38;")}"/>
            </media>
            <media xml:id="endSound" begin="recording.end+0.5s">
              <audio
                src="${OUTRO_SOUND}"/>
            </media>
            <media xml:id="bye" begin="endSound.end+1.0s">
              <speak>Bye for now. Hope to see you soon.</speak>
            </media>
          </par>
        </speak>`);
      } else {
        conv.close(
          "There are currently no recordings. Please try again later."
        );
      }
    })
    .catch(err => {
      console.log("Error getting documents", err);
      conv.close("Oops! Something went wrong. Please try again later.");
    });
});

// Cloud Functions for Firebase handler for HTTPS POST requests.
// https://developers.google.com/actions/dialogflow/fulfillment#building_fulfillment_responses
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);

exports.convertVideo = functions.https.onRequest((req, res) => {
  // cors(req, res, () => {
    process.env.GOOGLE_APPLICATION_CREDENTIALS='./healthcare-assitant-kxgfmk-firebase-adminsdk-3q8lq-047d0d801a.json'
    async function main() {
        // Imports the Google Cloud client library
        res.set({ 'Access-Control-Allow-Origin': '*' }).sendStatus(200)
  
        // Creates a client
        const client = new speech.SpeechClient();
      
     
        // The audio file's encoding, sample rate in hertz, and BCP-47 language code
        const audio = {
          uri: `gs://healthcare-assitant-kxgfmk.appspot.com/new_files/2020-01-19T03:33:59.580Z.wav`,
    
        };
        const config = {
          sampleRateHertz: 48000,
          languageCode: 'en-US',
          audioChannelCount: 2,
    
        };
        const request = {
          audio: audio,
          config: config,
          
        };
      
        // Detects speech in the audio file
        const [response] = await client.recognize(request).then((data)=> {
          const transcription = response.results
    
          .map(result => result.alternatives[0].transcript)
          .join('\n');
        console.log(`Transcription: ${transcription}`);
        let jsonData = {data:transcription}
        res.writeHead(200,{'Access-Control-Allow-Origin': '*'})
        res.json(jsonData)
        });
      }
      main().catch(console.error)

  });

// });

