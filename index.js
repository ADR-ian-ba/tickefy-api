//express and cors
const express = require ("express")
const cors = require ("cors")
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken")

const app = express()
app.use(bodyParser.json({ limit: "1000mb" }));
app.use(bodyParser.text())
app.use(bodyParser.urlencoded({ limit: "1000mb", extended: true }));
app.use(express.json());
app.use(cors())

require("dotenv").config()
const mongodbConnectionString = process.env.MONGODB_CONNECTION_STRING 
const jwtSecretKey = process.env.JWT_SECRET_KEY

const mongoose = require('mongoose');
const ConcertModel = require("./model/concertModel")
const BidModel = require("./model/bidModel")
const UserModel = require("./model/UserModel")
mongoose.connect(mongodbConnectionString);

const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(11)


app.post('/uploadconcert', async(req, res) => {

    try {
      const {type, posterImage, heroImage, concertName, description, artist, showNumber, shows } = req.body;
  
      const newConcert = new ConcertModel({
        eventType: type,
        concertName: concertName,
        concertDescription: description,
        concertArtist: artist,
        concertHeroImage: heroImage,
        concertPosterImage: posterImage,
        shows: shows.slice(0, showNumber),
      });

      const savedConcert = await newConcert.save();
      // console.log(savedConcert)

      for(let i = 0; i<savedConcert.shows.length; i++){
        for(let j = 0; j< savedConcert.shows[i].catNumber; j++){
          const newBid = new BidModel({
            catId: j,
            showId: savedConcert.shows[i]._id
          })

          const savedBidRoom = await newBid.save()
          console.log(savedBidRoom)
        }
      }

      console.log("success")

      

      res.json({ message: 'Data received successfully' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

app.get("/data", async (req, res)=>{
  const data = await ConcertModel.find({}, '_id concertPosterImage')
  console.log(data)
  res.json(data)
})

app.post("/concertdata", async(req, res)=>{
  const {data} = req.body
  console.log(data)

  const foundConcertData = await ConcertModel.findOne({_id : data})
  console.log(foundConcertData)

  const showData = []
  for(let i = 0; i<foundConcertData.shows.length; i++){
    const show = {
      showDate: foundConcertData.shows[i].date,
      showTime: foundConcertData.shows[i].time,
      showLocation: foundConcertData.shows[i].location,
      showId: foundConcertData.shows[i]._id,
    }

    showData.push(show)
  }

  const response = {
    concertName: foundConcertData.concertName,
    concertDescription: foundConcertData.concertDescription,
    concertArtist: foundConcertData.concertArtist,
    concertHeroImage: foundConcertData.concertHeroImage,
    shows: showData
  }

  console.log(response)

  res.json(response)
})

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new UserModel({
      username: username,
      email: email,
      password: hashedPassword
    });

    const newUser = await user.save();
    console.log(newUser);

    res.json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);

    res.status(500).json({ error: "Error registering new user" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const foundUser = await UserModel.findOne({ email: email });
    if (!foundUser) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    bcrypt.compare(password, foundUser.password, function(err, result) {
      if (err) {
        return res.status(500).json({ error: "Error during password comparison" });
      }
      if (result) {
        const payload = {
          id: foundUser._id,
          username: foundUser.username,
          authorized: true
        };

        const token = jwt.sign(payload, jwtSecretKey, { expiresIn: "24h" });
        return res.json({ token: token });
      } else {
        return res.status(401).json({ error: "Invalid credentials" });
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/validatetoken", async (req, res) => {
  const { token } = req.body;

  if (!token) {
      return res.status(403).send("No token provided");
  }

  try {
      const decoded = jwt.verify(token, jwtSecretKey);
      const foundUser = await UserModel.findOne({ _id: decoded.id });
      if (!foundUser) {
          return res.status(401).send("Invalid token: User not found");
      }

      if (foundUser.username == decoded.username) {
          return res.json(decoded.username);
      } else {
          return res.status(401).send("Invalid token: Username mismatch");
      }
  } catch (error) {
      console.log(error.message);

      // You can add more specific error handling based on the JWT error types here
      return res.status(401).send("Invalid token");
  }
});

app.post("/catdata", async(req,res)=>{
  const{showId, parentId} = req.body
  console.log(showId, parentId)

  try{
    const foundShow = await ConcertModel.findById({_id: parentId})

  for(let i = 0; i<foundShow.shows.length; i++){
    if(foundShow.shows[i]._id == showId){
      console.log(foundShow.shows[i])
      res.json(foundShow.shows[i])
    }
  }
  }catch(error){
    res.json(error)
  }

})

app.post("/getcat", async(req, res)=>{
  const {catId, showId, concertId} = req.body
  console.log(catId, showId, concertId)

  try{
    const foundConcert = await ConcertModel.findById({_id: concertId})
    const image = foundConcert.concertHeroImage
  
    const foundBid = await BidModel.findOne({catId: catId, showId: showId})
    const bidId = foundBid._id
  
    const data = {
      image: image,
      bidId: bidId
    }
  
    // console.log(image)
  
    res.json(data)
  }catch(error){
    res.json(error)
  }
})

app.post("/getbid", async(req, res)=>{
  const {json, catId, concertId, showId ,quantity, price} = req.body

  try{
    const userId = (jwt.verify(json, jwtSecretKey)).id
    if(!userId){
      res.json("fail")
    }
    let foundBid;

    for(let i = 0; i<quantity; i++){
        foundBid = await BidModel.findOneAndUpdate(
        { catId: catId, showId: showId },
        {
          $push: {
              buyOffer: {
                  buyerId: userId,
                  price: price
              }
          }
        },
        { new: true }
    );
    }
    
  if (!foundBid) {
    return res.status(404).send("Bid not found");
  }

  const foundUser = await UserModel.findOne({_id: userId});
    if (foundUser) {
        foundBid.buyOffer.forEach(offer => {
            // Check if this buy offer ID is already in the user's buyOfferId array
            const offerExists = foundUser.buyOfferId.some(buyOffer => buyOffer.buySellId === offer._id.toString());
    
            if (offer.buyerId.toString() === userId && !offerExists) {
                // Create a new buy offer object
                const buy = {
                    catId: catId,
                    showId: showId,
                    concertId, concertId,
                    buySellId: offer._id.toString()
                };
    
                // Push the new buy offer object to the user's buyOfferId array
                foundUser.buyOfferId.push(buy);
            }
        });
    
        // Save the updated user document
        await foundUser.save();
    }

  // Processing buyData
  const buyData = new Map();
    foundBid.buyOffer.forEach(offer => {
      buyData.set(offer.price, (buyData.get(offer.price) || 0) + 1);
    });

    const buyDataArray = Array.from(buyData, ([price, volume]) => [price, volume]);

    const sellData = new Map();
    foundBid.sellOffer.forEach(offer => {
    sellData.set(offer.price, (sellData.get(offer.price) || 0) + 1);
});

  const sellDataArray = Array.from(sellData, ([price, volume]) => [price, volume]);


    console.log(buyDataArray, sellDataArray)

    res.json({ bid: buyDataArray, offer: sellDataArray });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
});

app.post("/getoffer", async (req, res) => {
  const { json, catId, concertId, showId, quantity, price } = req.body;

  try {
    const userId = (jwt.verify(json, jwtSecretKey)).id
    if(!userId){
      res.json("fail")
    }
    let foundBid;

    for (let i = 0; i < quantity; i++) {
      foundBid = await BidModel.findOneAndUpdate(
        { catId: catId, showId: showId },
        {
          $push: {
            sellOffer: {
              sellerId: userId,
              price: price
            }
          } 
        },
        { new: true }
      );
    }



    if (!foundBid) {
      return res.status(404).send("Bid not found");
    }

    const foundUser = await UserModel.findOne({_id: userId});
    if (foundUser) {
        foundBid.sellOffer.forEach(offer => {
            // Check if this sell offer ID is already in the user's sellOfferId array
            const offerExists = foundUser.sellOfferId.some(sellOffer => sellOffer.buySellId === offer._id.toString());
    
            if (offer.sellerId.toString() === userId && !offerExists) {
                // Create a new sell offer object
                const sell = {
                    catId: catId,
                    showId: showId,
                    concertId, concertId,
                    buySellId: offer._id.toString()
                };
    
                // Push the new sell offer object to the user's sellOfferId array
                foundUser.sellOfferId.push(sell);
            }
        });
    
        // Save the updated user document
        await foundUser.save();
    }
    
    

    // Processing buyData
    const buyData = new Map();
    foundBid.buyOffer.forEach(offer => {
      buyData.set(offer.price, (buyData.get(offer.price) || 0) + 1);
    });

    const buyDataArray = Array.from(buyData, ([price, volume]) => [price, volume]);

    const sellData = new Map();
    foundBid.sellOffer.forEach(offer => {
    sellData.set(offer.price, (sellData.get(offer.price) || 0) + 1);
});

  const sellDataArray = Array.from(sellData, ([price, volume]) => [price, volume]);
    res.json({ bid: buyDataArray, offer: sellDataArray });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
});

app.post("/getprice", async(req,res)=>{
  const {catId, concertId, showId} = req.body;
  console.log("ok")

  try {
    const foundBid = await BidModel.findOne({ catId: catId, showId: showId })
    // Processing buyData
    console.log(foundBid)
    const buyData = new Map();
    foundBid.buyOffer.forEach(offer => {
      buyData.set(offer.price, (buyData.get(offer.price) || 0) + 1);
    });

    const buyDataArray = Array.from(buyData, ([price, volume]) => [price, volume]);

    const sellData = new Map();
    foundBid.sellOffer.forEach(offer => {
    sellData.set(offer.price, (sellData.get(offer.price) || 0) + 1);
});

  const sellDataArray = Array.from(sellData, ([price, volume]) => [price, volume]);


    console.log(buyDataArray, sellDataArray)

    res.json({ bid: buyDataArray, offer: sellDataArray });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
})

app.post("/getbidoffer", async(req, res)=>{
  const {token} = req.body
  
  if(!token){
    res.status(500)
  }

  const userId = jwt.decode(token, jwtSecretKey).id
  console.log(userId)

  try{
    const foundUser = await UserModel.findOne({_id: userId})


    let databuy = []
      const foundBuy = await BidModel.find({
        showId: foundUser.buyOfferId[i].showId,
        catId: foundUser.buyOfferId[i].catId,
        buyOffer: { $elemMatch: { _id: foundUser.buyOfferId[i].buySellId } }
      })
      console.log(JSON.stringify(foundBuy))
      res.json("ok")
  }catch(error){
    res.json(error)
  }


})

app.get("/test", (req, res)=>{
  res.json("ok")
})





app.listen(4000, () => {
    console.log("Server is listening on port 4000");
  });







