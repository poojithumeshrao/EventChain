#Shutdown any previously running instances
./network.sh down
#Start the blockchain network and create a channel between the organizations. 
./network.sh up createChannel -c mychannel -ca
#Install cashcard chaincode needed for handling our transactions
./network.sh deployCC -ccn cashcard -ccl javascript
