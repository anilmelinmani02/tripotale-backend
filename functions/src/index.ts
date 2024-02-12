import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as express from "express";
import * as allCitiesJson from "./indian-states-cities.json";
import * as cors from "cors";
import * as axios from "axios";
import {CHATGPT_API_KEY, SERVICE_ACCOUNNT} from "./constants";

const serviceAccount = SERVICE_ACCOUNNT;
const app = express();
app.use(express.json());
app.use(cors());

const chatGPTApiKey = CHATGPT_API_KEY;
const chatGPTUrl = "https://api.openai.com/v1/chat/completions";

/**
 * Get ChatGPT response based on the provided data.
 * @param {Object} userReqestedData - The data received for generating the response.
 * @return {Promise<string>}
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
         - 'shoulderMonths': An array which contains multiple objects;number of objects must be equal to no of selected cities.Each object contains 4 keys-
              1)cityName:'one of selected city'
              2)'shoulderMonths': Specifies the shoulder months range in related city.transitional periods between the peak tourist season and the off-season.
              3)'peakMonth': range of months when a Specifies city have best weather conditions.Many attractions and activities are fully operational.Best time to visit.
              4)'monthsToAvoid':range of months when a Specifies city may not be at its best for trip due to weather extremes, closures, or other unfavorable conditions.

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
      const isUserLogin = req.body?.userInfo?.loginStatus;
      if (isUserLogin == "true") {
        tripPlan.userTrip.tripPlanGenrationTime = new Date;
        tripPlan.userTrip.isCollectionSavedByUser = false;
        db.collection("users").doc(userInfo.userId).collection("tripPlans").add(tripPlan)
          .then((docRef) => {
            res.status(200).send({tripPlan: tripPlan, additionalDetails: {docId: docRef.id, user: userInfo.userId}}).end();
          })
          .catch(function(error) {
            console.error("Error adding document: ", error);
          });
      } else {
        res.status(200).send({tripPlan: tripPlan, additionalDetails: null}).end();
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

// save collection
app.put("/update-save-to-collection", async (req, res) => {
  try {
    const {docId, userId, isSavedToCollection} = req.body;

    if (!docId || !userId || isSavedToCollection === undefined) {
      return res.status(400).json({error: "Bad Request: Missing required parameters"}).end();
    }

    // Fetching the document from Firestore
    const docRef = db.collection("users").doc(userId).collection("tripPlans").doc(docId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      return res.status(404).json({error: "Not Found: Document not found"}).end();
    }

    // Update the collection save status
    await docRef.update({
      "userTrip.isCollectionSavedByUser": isSavedToCollection,
    });

    return res.status(200).json({message: "Collection save status updated successfully"}).end();
  } catch (error) {
    console.error("Error updating collection save status:", error);
    return res.status(500).json({error: "Internal Server Error"}).end();
  }
});

// get refCode from userId
app.get("/getRefCode/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const refDocSnapshot: any = await admin.firestore().collection("referralCodes").doc("refDoc").get();

    if (!refDocSnapshot.exists) {
      return res.status(404).json({error: "Referral document not found"});
    }

    const refDocData = refDocSnapshot.data();
    const refCode = refDocData[userId];
    if (!refCode) {
      return res.status(404).json({error: "RefCode not found for the provided userId"});
    }

    return res.json({refCode});
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({error: "Internal server error"});
  }
});

// get userId from refCode
app.get("/getUserId/:refCode", async (req, res) => {
  try {
    const refCode = req.params.refCode;

    const refDocSnapshot = await admin.firestore().collection("referralCodes").doc("refDoc").get();

    if (!refDocSnapshot.exists) {
      return res.status(404).json({error: "Referral document not found"});
    }

    const userData:any = refDocSnapshot.data();

    const userId = Object.keys(userData).find((key) => userData[key] === refCode);

    if (!userId) {
      return res.status(404).json({error: "UserId not found for the provided refCode"});
    }

    return res.json({userId});
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({error: "Internal server error"});
  }
});

// for cities
app.get("/IND/states-cities", (req, res) => {
  res.send(allCitiesJson).end();
});

export const api2 = functions.runWith({timeoutSeconds: 540}).https.onRequest(app);
