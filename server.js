"use strict";

const express = require("express");
const multer = require("multer");
const fileType = require("file-type");
const fs = require("fs");
const app = express();
const router = express.Router();

const port = process.env.PORT || 8081;
const publicPath = __dirname + "/public/";

const render = (filename, params = {}) => {
  let baseParams = {
    baseUrl: `http://localhost:${port}`
  };
  const mergeParams = Object.assign(baseParams, params);

  return new Promise((resolve, reject) => {
    fs.readFile(filename, "utf8", (err, data) => {
      if (err) return reject(err);
      for (var key in mergeParams) {
        data = data.replace("@{" + key + "}", params[key]);
      }
      resolve(data);
    });
  });
};

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'images/');
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({
  dest: "images/",
  limits: { fileSize: 100000000, files: 20 },
  fileFilter: (req, file, callback) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return callback(new Error("Only Images are allowed !"), false);
    }

    callback(null, true);
  },
  storage: storage
}).array("photos", 20);

router.post("/images/upload", (req, res) => {
  upload(req, res, function(err) {
    if (err) {
      res.status(200).json({ status: false, message: err.message });
    } else {
      let files = [];

      if (req.files.length > 0) {
        req.files.forEach(file => {
            files.push(file.filename);
        });

        res.status(200).json({ status: true, files: files });
      } else {
        res.status(200).json({ status: false, message: "Image Uploaded Error !" });
      }
    }
  });
});

router.delete("/images/:imagename", (req, res) => {
    let imagename = req.params.imagename
    let imagepath = __dirname + "/images/" + imagename

    try {
        fs.unlinkSync(imagepath)
        res.status(200).json({ status: true })
    } catch(err) {
        res.status(200).json({ status: false, message: err })
    }
});

router.get("/images", (req, res) => {
    let files = [];
    fs.readdirSync(__dirname + "/images/").forEach(file => {
        if (!file.match(/\.(DS_Store)$/)) {
            files.push(file)
        }
    });

    res.status(200).json({ status: true, files: files })
});

router.get("/images/:imagename", (req, res) => {
  let imagename = req.params.imagename;
  let imagepath = __dirname + "/images/" + imagename;
  let image = fs.readFileSync(imagepath);
  let mime = fileType(image).mime;

  res.writeHead(200, { "Content-Type": mime });
  res.end(image, "binary");
});

router.get("/", (req, res) => {
  render(publicPath + "upload.html")
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).json({ message: err.message });
    });
});

app.use(express.static(__dirname + "/public"));
app.use("/", router);

app.use((err, req, res, next) => {
  if (err.code == "ENOENT") {
    res.status(404).json({ message: "Page Not Found !" });
  } else {
    res.status(500).json({ message: err.message });
  }
});

app.listen(port);
console.log(`App Runs on http://localhost:${port}`);
