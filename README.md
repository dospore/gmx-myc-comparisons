# GMX MYC Comparison Tools
A couple of different tools to check the performance of myc compared to gmx


## Execution Latency
Logs execution times for increase and decrease positions. Displays a graph to represent the event data.
Unfortunately this data is stored in an event so the max accuracy we are getting is 1 second. We believe we can get this down to 100ms with some of our off chain architecture and are looking to report these results soon. 

To change the block interval increase or decrease the fromBlock and toBlock params in ./check-latency.js main() function.

### Running
```yarn && yarn latency```
