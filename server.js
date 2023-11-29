const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const cors = require('cors');

const mongoose = require('mongoose');
const Log = require('./Model/Log');
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
// app.use(cors({
//     origin: 'https://6567a028158c871054a6c44c--relaxed-monstera-739405.netlify.app/'
// }));



const MONGO_URI=process.env.MONGO_URL

mongoose.connect(MONGO_URI).then(() => {
  console.log('connection success')
})
mongoose.connection.on('error', err => {
  console.log(err)
})

app.get('/api/hello', async (req, res) => {
    const userId = req.query.userId;
    let status = 'success';
    let errorMessage = '';

    try {
        if (Math.random() < 0.1) {
            throw new Error('Random API Failure');
        }

        const responseMessage = `Hello World! User ID: ${userId}`;
        res.json({ message: responseMessage });

        await Log.create({
            userId,
            status,
            requestDetails: req.query,
            responseDetails: { message: responseMessage }
        });
    } catch (error) {
        status = 'failure';
        errorMessage = error.message;
        res.status(500).json({ error: errorMessage });

        await Log.create({
            userId,
            status,
            errorMessage,
            requestDetails: req.query,
            responseDetails: {}
        });
    }
});

app.get('/api/analytics', async (req, res) => {
  try {
      const { startTime, endTime } = req.query;

      const start = new Date(startTime);
      const end = new Date(endTime);

      const totalCalls = await Log.countDocuments({ timestamp: { $gte: start, $lte: end } });
      const totalFailures = await Log.countDocuments({ status: 'failure', timestamp: { $gte: start, $lte: end } });
      const uniqueUsers = await Log.distinct('userId', { timestamp: { $gte: start, $lte: end } });

      const graphData = await Log.aggregate([
          {
              $match: {
                  timestamp: { $gte: start, $lte: end }
              }
          },
          {
              $group: {
                  _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                  totalCalls: { $sum: 1 },
                  totalFailures: { $sum: { $cond: [{ $eq: ["$status", "failure"] }, 1, 0] } },
                  uniqueUserIds: { $addToSet: "$userId" }

              }
          },
          {
            $project: {
                totalCalls: 1,
                totalFailures: 1,
                uniqueUserCount: { $size: "$uniqueUserIds" }
            }
        },
        {
            $sort: { _id: 1 }
        }
      ]);

      res.json({
          totalUniqueUsers: uniqueUsers.length,
          totalCalls,
          totalFailures,
          graphData
      });
  } catch (error) {
      res.status(500).send({ error: error.message });
  }
});

app.get('/api/logs', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const logs = await Log.find()
                              .sort({ timestamp: -1 })
                              .skip(skip)
                              .limit(limit);

        const totalLogs = await Log.countDocuments();
        const totalPages = Math.ceil(totalLogs / limit);
        const hasMore = page < totalPages;

        res.json({
            page,
            totalPages,
            totalLogs,
            logs,
            hasMore
        });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});


const port = 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});