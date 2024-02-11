require("dotenv").config();

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const { connectToMongoDb } = require("./connect");
const {restrictToLoggedinUserOnly,checkAuth} = require("./middleware/auth");

const URL = require("./models/url");


const urlRoute = require("./routes/url");
const staticRoute = require("./routes/staticRouter")
const userRoute = require("./routes/user");

const exp = require("constants");

const app = express();
const PORT = process.env.PORT || 8001;


connectToMongoDb(
  // 'mongodb://127.0.0.1:27017/short-url',
  process.env.MONGO_URL,
 {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Connected to MongoDB');
})
.catch((error) => {
    console.error('Error connecting to MongoDB:', error);
});

app.set("view engine","ejs");
app.set("views", path.resolve("./views"))

app.use(express.json());
app.use(express.urlencoded({ extended: false}));
app.use(cookieParser());

app.get("/test", async (req,res) => {
    const allUrls = await URL.find({});
    return res.render("home", {
        urls : allUrls,
    });
});

app.get("/url/:shortId", async (req, res) => {
    const shortId = req.params.shortId;
    const entry = await URL.findOneAndUpdate(
      {
        shortId,
      },
      {
        $push: {
          visitHistory: {
            timestamp: Date.now(),
          },
        },
      }
    );
    res.redirect(entry.redirectURL);
  });


app.use("/url",restrictToLoggedinUserOnly, urlRoute);
app.use("/user", userRoute);
app.use("/",checkAuth,staticRoute);


app.listen(PORT, () => console.log(`Server started at PORT:${PORT}`))

