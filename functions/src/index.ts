
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as express from "express";
// import * as pune from "./puneCityData.json";
import * as allCitiesJson from "./indian-states-cities.json";
import * as cors from "cors";
import * as axios from "axios";

const serviceAccount = {
  "type": "service_account",
  "project_id": "tripotale-f1db9",
  "private_key_id": "197f5fbc4b2dbf1a7621d9bb2b260a0f11bdbd31",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCNfCpauelF4qmH\n4C0H5uI53MSkDOltsgzgRerQ8R2PAEdW7Q9uUECql82kAM7KS6DtKEh+5hHdI8a3\nWZWWiiMhRa372pZnNjtk69yX6Y3nJRs20bEQ3iUaiq4cfVWpHhIZlq5niGjvhmED\nkpSo0td7PzYnlbLcawx4XQz7ENp4VBa/5x0MOg03NkrLxScl3w2LxPRnl44n8BSo\nf4TXczr6An2b7nNTBzKSqg6HV6z/YdwKzE+BElhFpOds2TQoFtQ0bAMTNzcbsT2i\nM2CUrtg0lY1c+ct8h7nA4Py83R/FMhwCmIRuSY8hD85W2yRQztW8tvu5T6cMugwh\nwm3EFONFAgMBAAECggEACy2S5BGZmDug5LsFm8D2QReL0qExhQji4worE+Bk0zI0\nsK2wgSjmfwPYy5sDu3BPscTzu1Deeu/zaHNzsc3OmjeY2BPMO7HJbf8Dcd4SJ7+i\n/4kAGgLPACKSQG53iNG3IN3qgAQDNF9TxVY8l/z2aMaU9vopBCiR9uV1G9XYSNbP\n0MsdG4If6jspjbmTUp9oDLeHwsjDKla2QZLgs/KyXtw43YJZMsHRJgU9bQbX6J+T\nmXBbNMCPaodv23QFHtt4Av1HK0hlFbUCnOK075rHZwtik82UUUqsPN1huEmaIEOG\nqHbIdyYEZ6hpluif/6g8KgHUO/SX+Ys0635L3STxeQKBgQDFT5XM7sWnTOWhwW0W\n7ogXjW1KVoMcC12k7JlmwXd7XwDaLzIJB32drWVzSpD3U65K3RgyDMt3XtEzmGjh\ni/9n6Xab1IA1rLp7Demurtcwu3aW5Ia/xYmlWGypGW9L1owe3HpkKFIduX/kxYY1\nlJgX1y9enx4O4AYLqFufVv35mQKBgQC3kauDVM5mOBWDYh9Zw6IhI2IV3DM9Cuox\nIDkeFQYzviFuVkQpRe/05VkBBqX1EdzEKkgpteX86y9mHKfExAlWo558+/btwBgU\nq8gqM0h+W7NumyZw93pmp0opHBCSUQf2czBWMYw5g4GP1ralxORLDgkkAQYThsQF\n4NYrfev6jQKBgCj46smAd6jTDgg161pMtBP3+U7rghRLw+lgfEZbPF1xD/M+w6we\nUxZwEFYNkObbCKFhIgoaoBGsrdKB/p1/fcztLQUU7n623I57CCCPC/6BnxGcaOLf\nuUKNhxriPjtIVRZ/gCbWPJ8Rix5Nah4sOh0RQTPr5Mj/+iFnl4cSAHFZAoGAT6kP\nXPa4evNropA6OqIDAY5xSjs8oQjTiG4LW1qUTm/74f3dpmuLLiM49JEGA8u0mgwf\nNLqTC6aj8xQMWf8YbliitmpBRftOd+nz+xw2IV96Bk2d6Pf8Tf/a1uwu5M/1PKXQ\nHBd0WqEO4HS03ksLJub4YH9xO5gICOUBC+6hMSECgYAKAtnheAtJwGXpT6n/yx2c\nLBnY9s1c3kSX+8J/3wxBqXjzKvDdn8YX9kuXi8tW/5tujSWDSV6T/OkpMyIub5df\nILfoOx0gbdk9OMxZOPf7qUsoUzWyBUgBiXCNe91s4lRqxkynwUzq6PLgMoYikfUJ\ncyRFfspgEdgoolk9k1KE3g==\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xi0xj@tripotale-f1db9.iam.gserviceaccount.com",
  "client_id": "108609559075474383208",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xi0xj%40tripotale-f1db9.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com",
};

const app = express();
app.use(express.json());
app.use(cors());

const chatGPTApiKey = "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";
const chatGPTUrl = "https://api.openai.com/v1/chat/completions";

/**
 * Get ChatGPT response based on the provided data.
 * @param {Object} userReqestedData - The data received for generating the response.
 * @return {Promise<string>} The generated response from ChatGPT.
 */

const serviceAccountCasted = serviceAccount as admin.ServiceAccount;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountCasted),
  databaseURL: "https://tripotale-f1db9-default-rtdb.firebaseio.com",
});

const db = admin.firestore();
app.post("/getItineraryDetails", async (req, res) => {
  const userInfo = req.body?.userInfo;
  const userReqestedData = req.body?.userReq;
  console.log("Inside getItineraryDetails with request body => ", req.body);

  try {
    const prompt = `
    Consider below provided itinerary details 
      - trip start city (from city) : ${userReqestedData.journeyStartFrom}
      - cities to visit : ${userReqestedData.selectCity.join(", ")}
      - trip start date: ${userReqestedData.journeyStartDate}
      - trip end date: ${userReqestedData.journeyEndDate}
      - Number of people: ${userReqestedData.peopleCount}
      - travel partner: ${userReqestedData.selectCandidate}
      - budget per person: ${userReqestedData.moneySpend}
      - interested in activities: ${userReqestedData.selectActivity.join(", ")}
      - mode of travel: ${userReqestedData.modeOfTravell}
      ${userReqestedData.preferredPlaces ? `- preferred places: ${userReqestedData.preferredPlaces}` : ""}
      ${userReqestedData.notPreferredPlaces ? `- notPreferred places: ${userReqestedData.notPreferredPlaces}` : ""}
      
      Generate a personalized trip itinerary based on the provided details. Ensure that the user can select multiple cities, so you have to create plans based on the tourist places available in the selected cities.If the user provides preferred places in 
      'preferredPlaces', prioritize these places in the plan, also add new places for visit by avoiding notPreferred places (if any).
      Make sure places are not repeating in the plan.
      The response should be a well-formatted JSON.
      Structure the response in a object named 'userTrip' with two main keys:
      1) 'tripPlans': An array representing details of itineraries days-wise. Ensure the number of days to visit places is 
      based on the trip start date and trip end date for example 
      trip start date is 05/01/2024 and trip start date is 11/01/2024 then number of days to visit must be exactly 6, 
      so make 6 days itinerary plans; Each day should include at least 3 places to visit related to the user choosed cities to visit.
      avoid notPreferredPlaces and add preferredPlaces on priority.Plan must contains different places for visiting ,don't repeat a place throughout a plan.
      Ensure a balanced distribution of days among the selected cities.
      structure of plan must be:
         - 'location': Object with the city name, coordinates (latitude and longitude).
         - 'activities': An array of activity objects, each containing:
            - 'placeName': Name of the place to visit.
            - 'commentOnPlace': 1-2 line comment on place.
            - 'time': Best time of the day for visit to respective place.
            - 'details': Information about the activity/place in 20-30 words.
            - 'coordinates': Object with GPS coordinates (latitude and longitude).
            - 'cityName': Name of the city.
            - 'imageUrl': One URL of an image related to the tourist place.
             Utilize tools/platforms like Google Images, Wikipedia, Unsplash, Pixabay, or any other external services for reliable URLs. For example, here is one image URL for reference: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxzgJNrh6Nl3STYCsUNDsSbQRTjkJFcPnHvQ&usqp=CAU"."
            - 'meal': Recommended meal for the activity.
            - 'crowd': Showing crowd in place in string formate, like 'Highly crowded' or 'Less crowded' or 'Moderately crowded' 
            Make sure placeName is not reapeting throughout plan.
         - 'moreAboutCity': Object containing details about the city, including:
            - 'cityImageUrl': One URL of an image of famouse view of the city.You can use any tools/flatform like google images,
            wikipedea or any other external services for search reliable URL for city.Make sure image url is realtime and working properly.
            - 'currency': Legal currency used in the city .
            - 'cityName': Name of the city.
            - 'temperature': Average temperature in Celsius example '10°C'.
            - 'localLanguage': Preferred language in the city.
            - 'currencyExchangeRate': Exchange rate with 1 USD.
         - 'dayDetail': String showing the date and week-day of the itinerary.For e.g. Wed, 08 Nov.
         Make sure to create days to visit is equivalent of days between trip start date & trip end date.Each activity object must contains 
         different places, without reapeting places.
         If their is no tourist places in selected cities,then send a simple string-'Please select any other city to enjoy your trip' in tripPlans array insted of creating dummy/wrong tip-plan.
      
      2) 'moreTripDetails': Object containing:
      - 'bestTravellingMode' : Show available mode of travel out of (plane,ship,bus,train). For travel from trip start city which is: ${userReqestedData.journeyStartFrom} To choosed cities for visit which is/are 
      ${userReqestedData.selectCity.join(", ")} . Remember to give priority to the user-selected mode of travel (if available), which is: '${userReqestedData.modeOfTravell}'. If ${userReqestedData.modeOfTravell} service is not available for travel from ${userReqestedData.journeyStartFrom} To ${userReqestedData.selectCity.join(", ")}, then choose the best alternative one.
      - 'secondBestTravellingMode': Suggest a secondary best mode of travel for visit ${userReqestedData.selectCity.join(", ")} from ${userReqestedData.journeyStartFrom} ensuring it is different from the bestTravellingMode .
         - 'estimatedBudget':is a object with two main keys accommodationCost & foodCost:
            - 'accommodationCost': Object with 'hostel' (estimated cost for hostel per night stay) and 'hotel' (average cost for hotel per night stay).
            - 'foodCost': Object with 'budget' (estimated cost for food per meal) and 'fancyMeal' (highest cost of a fancy meal).
         - 'localCuisine': Array of object having two keys 1)name:food name, 2)comment:one line comment on food(3 to 5 items).
         - 'highRatedRestaurants': Array of 3-4 high-rated restaurant, Each contains two keys 1)name:restaurant name, 2)comment: one line comment on restaurant.
         - 'suggestions': Array of suggestions about city travel and other tourist places.
         - 'trivia': Array with 3-4 trivia questions and answers related to the selected places.
         - 'shoulderMonths': object  which contains an array named 'cities'. Array 'cities' comprises multiple objects;number of objects must be equal to no of selected cities.Each object contains 3 keys-
              1)cityName:'one of selected city'
              1)'months': Specifies the shoulder months range in related city, such as 'June to December. '
              2)'seasonsInfo': A comment of 100-125 words providing information on the seasons, weather, and atmosphere during the shoulder months in the respective city."

         Ensure the structure of response should be in well-formatted and completed Json , If there are any issues or the response is incomplete, continue to regenerate until a valid and complete JSON response is received.
         So it can be easily parsed without an issue.If any issues happen. Generate only JSON response.
         Do not generate user-suggestions, guidance, or incomplete responses.
      `;

    // Send the prompt to ChatGPT and get the response
    const response = await axios.default.post(
      chatGPTUrl,
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant.",
          },
          {
            role: "user", content: prompt,
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${chatGPTApiKey}`,
        },
        timeout: 500000,
      }
    );
    const chatGPTResponse = response.data.choices[0].message.content;
    console.log("chatGPTResponse before parse", chatGPTResponse);
    // Assuming the response is in JSON format, parse it

    try {
      const tripPlan = JSON.parse(chatGPTResponse);
      console.log("response from gpt", tripPlan);
      // Send the generated trip plan to the user as a response
      // STORE RESULT IN DB IF USER IS LOGGED IN chatGPTResponse + timestamp
      res.status(200).send(tripPlan).end();

      tripPlan.userTrip.tripPlanGenrationTime = new Date;
      const isUserLogin = req.body?.userInfo?.loginStatus;
      if (isUserLogin == "true") {
        db.collection("users").doc(userInfo.userId).collection("tripPlans").add(tripPlan);
      }

      return;
    } catch (jsonParseError) {
      console.error("Error parsing JSON response:", jsonParseError);
      res.status(500).json({error: "Error parsing JSON response"});
      return;
    }
  } catch (error: any) {
    console.error("Error calling ChatGPT API - ", error);
    if (error.code == "ECONNABORTED") {
      res.status(500).send("The request to ChatGPT api timed out. Please try again later.").end();
      return;
    } else {
      res.status(500).send("An error occurred while processing your request. Please try again later.").end();
      return;
    }
  }
});

// for cities
app.get("/IND/states-cities", (req, res) => {
  res.send(allCitiesJson).end();
});

export const api2 = functions.runWith({timeoutSeconds: 540}).https.onRequest(app);
