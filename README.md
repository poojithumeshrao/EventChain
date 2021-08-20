# EventChain


# Prerequisites needed for running Hyperledger Fabric

Please follow the instructions in

1. https://hyperledger-fabric.readthedocs.io/en/latest/prereqs.html
2. https://hyperledger-fabric.readthedocs.io/en/latest/install.html
3. Install nodejs v14.x by following the instructionshere -
    https://node.dev/node-binary
4. Install npm by - sudo apt-get install npm

# Building the EventChain and running the application

1. Untar the attached tar file - eventChain.tar.gz.
2. Go to test-network folder - cd test-network/
3. Run the script network-start.sh to bring up the network- ./network-start.sh
4. For running the application go to the folder - cd../cashcard/application-javascript/


5. Before executing the application for the first time please install all the necessary
    dependencies by executing - npm install
6. Delete any previously stored certificates - rm -rwallet*
7. Interact with the application by passing suitablecommand line arguments. To get
    help regarding the usage run - node eventChain.js-h
8. After interacting with the application stop the blockchainnetwork
    a. Go to test-network folder - cd test-network/
    b. Run the script network-stop.sh to shut down the network-
       ./network-stop.sh

# Common errors and fixes

1. Error with docker permission denied -
    https://stackoverflow.com/questions/48957195/how-to-fix-docker-got-permission-
    denied-issue
2. Failed to register user : Error: fabric-ca requestregister failed with errors [[ {
    code: 20, message: 'Authentication failure' } ]]
       ******** FAILED to run the application: Error: Identitynot found in wallet: appUser
    -> Delete the cashcard/application-javascript/wallet_retailand
    cashcard/application-javascript/wallet_cash directoryand retry this application.
    The certificate authority must have been restartedand the saved certificates for
    the admin and application user are not valid. Deletingthe wallet store will force
    these to be reset with the new certificate authority.

# References

1. https://hyperledger-fabric.readthedocs.io/en/latest/test_network.html
2. https://kctheservant.medium.com/from-first-network-to-test-network-a-new-test-n
    etwork-introduced-in-fabric-v2-0-81faa924ce


