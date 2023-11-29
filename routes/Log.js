const Log = require('Backend/Model/Log');
const express = require('express');
const router = express.Router();

router.get('/api/analytics', async (req, res) => {
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
                    totalFailures: { $sum: { $cond: [{ $eq: ["$status", "failure"] }, 1, 0] } }
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

module.exports = router;
