import React, { Component } from "react";
import './App.css';
import getWeb3 from "./getWeb3";
import Voting from "./contracts/Voting.json";


class User extends Component {  
    state = { web3: null, accounts: null, contract: null, step: 0, isV: false, isA: false, proposals: null, voters: null, winningDesc: null, winningID: null, winningCount: null};

    componentDidMount = async () => {
      try {
        const web3 = await getWeb3();
        const accounts = await web3.eth.getAccounts();
        const networkId = await web3.eth.net.getId();
        const deployedNetwork = Voting.networks[networkId];
        const instance = new web3.eth.Contract(
          Voting.abi,
          deployedNetwork && deployedNetwork.address,
        );

        const account = accounts[0];
        let isAdmin=false;
        let isVoter=false;

        let votersEvent= await instance.getPastEvents('VoterRegistered', {fromBlock: 0, toBlock: 'latest'});
        for (let i=0; i < votersEvent.length; i++){
          if(votersEvent[i]["returnValues"]["_voterAddress"]==account){isVoter=true;}
        }

        let Admin = await instance.methods.owner().call();
        if (Admin===account){isAdmin=true;} else {isAdmin=false;}


        this.setState({ web3, accounts, contract: instance, isV: isVoter, isA:isAdmin}, this.runInit);
      } catch (error) {
        alert( `Non-Ethereum browser detected. Can you please try to install MetaMask before starting.`, );
        console.error(error);
      }
    };

    runInit = async() => {
        const { contract } = this.state;
        let stepA = await contract.methods.workflowStatus().call();
        const proposalsA = await contract.methods.getProposals().call();
        const winningID= await contract.methods.winningProposalID().call();
        let winningProposal;
        try{
          winningProposal= await contract.methods.getOneProposal(winningID).call();
          const winningDesc= winningProposal.description;
          const winningCount= winningProposal.voteCount;
          this.setState({ step: stepA, proposals: proposalsA, winningDesc:winningDesc, winningID: winningID, winningCount: winningCount });
      } catch (error){
          this.setState({ step: stepA, proposals: proposalsA});
      }
    }; 

    registerVoter = async() => {
        const { accounts, contract } = this.state;
        const address = document.getElementById("address").value;
        await contract.methods.addVoter(address).send({from: accounts[0]});
        this.runInit();
    }

    propose = async() => {
        const { accounts, contract} = this.state;
        let prop= document.getElementById("propal").value;
        await contract.methods.addProposal(prop).send({from: accounts[0]});
        this.runInit();
    }

    vote = async() => {
        const { accounts, contract} = this.state;
        let voted = document.getElementById("votedId").value; 
        await contract.methods.setVote(voted).send({from: accounts[0]});
        this.runInit();
    }

    checkVoter = async() => {
        const { contract } = this.state;
        const address = document.getElementById("checkAddress").value;
        const voter = await contract.methods.getVoter(address).call();
        let whichVote = voter.votedProposalId;
        document.getElementById("whichVote").innerHTML="L'utilisateur demandé a voté pour la propal à l'index " + whichVote;
    }

    nextStep = async() => {
        const { contract,accounts } = this.state;

        let step=this.state.step;
        if (step==0){
          await contract.methods.startProposalsRegistering().send({from: accounts[0]});
        }
        else if (step==1){
          await contract.methods.endProposalsRegistering().send({from: accounts[0]});
        }
        else if (step==2){
          await contract.methods.startVotingSession().send({from: accounts[0]});
        }
        else if (step==3){
          await contract.methods.endVotingSession().send({from: accounts[0]});
        }
        else if (step==4){
          await contract.methods.tallyVotes().send({from: accounts[0]});
        }
        this.runInit();

    }


    render(){

        if (!this.state.web3) {
            return <div>Loading Web3, accounts, and contract...</div>;
          } 
        if (this.state.isA==false && this.state.isV==false){
            return (
                <div>Vas t'en! Tu n'as rien à faire ici</div>
            )
        }

        if( this.state.step == 0 ){
            if(this.state.isA==true){
                return(      
                    <div className="user">
                        <img id="logo" src="/alyra.jpeg" alt="logo"/>
                        <h1>Bonjour l'admin.</h1><p>La session de vote en est actuellement à l'étape {this.state.step}</p>
                        <h2>A cette étape, vous pouvez ajouter des adresses à whitelister: </h2>
                        <input type="text" id="address"  />
                        <button onClick={this.registerVoter} > Envoyer </button>
                        <br />
                        <h2>Vous pouvez mettre fin à cette étape et passer à la suivante en cliquant</h2>
                        <button onClick={this.nextStep} >Etape suivante</button>
                    </div>
                )
            }
            else{
                return(      
                    <div className="user">
                        <img id="logo" src="/alyra.jpeg" alt="logo"/>
                        <h1>Bonjour le voteur.</h1><p>La session de vote en est actuellement à l'étape {this.state.step}</p>
                        <h2>A cette étape, vous devez attendre que l'administrateur lance l'étape des propositions (ou vous rajoute a la whitelist, si ce n'est deja fait)</h2>
                    </div>
                )
            }
           
        }


        else if ( this.state.step == 1){
            if(this.state.isA==true){
                return(      
                    <div className="user">
                        <img id="logo" src="/alyra.jpeg" alt="logo"/>
                        <h1>Bonjour l'admin.</h1><p>La session de vote en est actuellement à l'étape {this.state.step}</p>
                        <p>C'est l'étape où les votant peuvent faire des proposition</p>

                        <br />
                        <h2>Vous pouvez mettre fin à cette étape et passer à la suivante en cliquant</h2>
                        <button onClick={this.nextStep} >Etape suivante</button>
                    </div>
                )
            }
            else{
                return(      
                    <div className="user">
                        <img id="logo" src="/alyra.jpeg" alt="logo"/>
                        <h1>Bonjour le voteur.</h1><p>La session de vote en est actuellement à l'étape {this.state.step}</p>
                        <h2>A cette étape, vous pouvez proposer des idées sur lesquelles voter ici:</h2>
                        <input type="text" id="propal" />
                        <button onClick={this.propose} >Proposer</button>              
                    </div>
                )
            }
        }


        else if ( this.state.step == 2){
            if(this.state.isA==true){
                return(      
                    <div className="user">
                      <img id="logo" src="/alyra.jpeg" alt="logo"/>
                        <h1>Bonjour l'admin.</h1><p>La session de vote en est actuellement à l'étape {this.state.step}</p>
                        <p>C'est l'étape entre les propositions et les votes</p>

                        <br />
                        <h2>Vous pouvez mettre fin à cette étape et passer à la suivante en cliquant</h2>
                        <button onClick={this.nextStep} >Etape suivante</button>
                    </div>
                )
            }
            else{
                return(      
                    <div className="user">
                      <img id="logo" src="/alyra.jpeg" alt="logo"/>
                        <h2>A cette étape, vous devez attendre que l'administrateur lance l'étape des votes</h2>
                        <p>En attendant, voici l'ensemble des propositions qui ont été soumises au prochain vote: </p>
                        <table><tr><th>index</th><th>description</th><th>nombre de voix</th></tr>
                        {this.state.proposals.map((propal, index) =><tr><td>{index}</td><td>{propal.description}</td><td>{propal.voteCount}</td></tr>)}
                        </table>
                    </div>
                )   
            }     
        }

        else if ( this.state.step == 3){
            if(this.state.isA==true){
                return(      
                    <div className="user">
                      <img id="logo" src="/alyra.jpeg" alt="logo"/>
                        <h1>Bonjour Monsieur l'admin.</h1><p>La session de vote en est actuellement à l'étape {this.state.step}</p>
                        <p>C'est l'étape où les votant peuvent voter</p>
                        <br />
                        <h2>Vous pouvez mettre fin à cette étape et passer à la suivante en cliquant</h2>
                        <button onClick={this.nextStep} >Etape suivante</button>
                    </div>
                )
            }
            else{
                return(      
                    <div className="user">
                      <img id="logo" src="/alyra.jpeg" alt="logo"/>
                        <h1>Bonjour Monsieur le voteur.</h1><p>La session de vote en est actuellement à l'étape {this.state.step}</p>
                        <h2>A cette étape, vous pouvez voter pour la meilleure idée. Vous pourrez changer votre vote jusqu'à la fin de cette étape.</h2>
                        <input type="text" id="votedId" />
                        <button onClick={this.vote} >Voter</button>
                        <br /> 
                        <table><tr><th>index</th><th>description</th><th>nombre de voix</th></tr>
                        {this.state.proposals.map((propal, index) =><tr><td>{index}</td><td>{propal.description}</td><td>{propal.voteCount}</td></tr>)}
                        </table>            
                    </div>
                )
            }
        }

        else if ( this.state.step == 4){
            if(this.state.isA==true){
                return(      
                    <div className="user">
                      <img id="logo" src="/alyra.jpeg" alt="logo"/>
                        <h1>Bonjour l'admin.</h1><p>La session de vote en est actuellement à l'étape {this.state.step}</p>
                        <p>C'est l'étape entre les votes et l'annonce des resultats</p>
                        <br />
                        <h2>Vous pouvez mettre fin à cette étape et passer à la suivante en cliquant</h2>
                        <button onClick={this.nextStep} >Etape suivante</button>
                    </div>
                )
            }
            else{
                return(      
                    <div className="user">
                      <img id="logo" src="/alyra.jpeg" alt="logo"/>
                        <h1>Bonjour le voteur.</h1><p>La session de vote en est actuellement à l'étape {this.state.step}</p>
                        <h2>A cette étape, les votes sont finis, vous devez attendre le comptage par l'admin.</h2>
                        <br />
                        <table><tr><th>index</th><th>description</th><th>nombre de voix</th></tr>
                        {this.state.proposals.map((propal, index) =><tr><td>{index}</td><td>{propal.description}</td><td>{propal.voteCount}</td></tr>)}
                        </table>
                    </div>
                )
            }
        }

        else if ( this.state.step == 5){
            return(      
                <div className="user">
                  <img id="logo" src="/alyra.jpeg" alt="logo"/>
                    <h1>Bonjour.</h1><p>La session de vote en est actuellement à l'étape {this.state.step}</p>
                    <h2>Nous avons notre grand gagnant! C'est la proposition {this.state.winningDesc}, de numéro d'id {this.state.winningID} avec {this.state.winningCount} votes. </h2>
                    <p>Si vous voulez voir pour qui a voté un utilisateur, rentrez son addresse ici:</p>
                    <input type="text" id="checkAddress" />
                    <button onClick={this.checkVoter} >Check</button>
                    <div id="whichVote"></div>
                    <br />
                    <table><tr><th>index</th><th>description</th><th>nombre de voix</th></tr>
                    {this.state.proposals.map((propal, index) =><tr><td>{index}</td><td>{propal.description}</td><td>{propal.voteCount}</td></tr>)}
                    </table>
                </div>
            )
        } 
    }
}
export default User;