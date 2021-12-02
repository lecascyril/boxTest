// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

/** @title Voting contract
    @notice An owner can add voters, they can set proposals, then vote for them, and the choosen one win
    @author Cyril Castagnet. */
contract Voting is Ownable {

    // for front reason, proposals have now a getter
    // deleting useless comment about draw possibilities

    /** @notice Store the ID of the winning poposal after tally votes */
    uint public winningProposalID;
    
    /** @notice Set the structure of a Voter
    *   @param isRegistered is he a voter? 
    *   @param hasVoted has he voted yet? 
    *   @param votedProposalId if so, for which proposal? */
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }

    /** @notice set the structure of a Proposal
    *   @param description description of the proposal, can be whatever we want, a candidate, an idee...
    *   @param voteCount how many backers? */
    struct Proposal {
        string description;
        uint voteCount;
    }

    /** @notice set the structure of workflow status 
    * @dev the naming is explicit, we should go from one to the next */
    enum  WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    /** @notice set the var we use for the contract state */
    WorkflowStatus public workflowStatus;

    /** @notice set proposal storage 
    *   @dev array because we will loop on them */
    Proposal[] public proposalsArray;

    /** @notice set voters storage */
    mapping (address => Voter) private voters;

    /** @notice used to store the address of registered voters
    *   @param _voterAddress the address of the registered voter */
    event VoterRegistered(address _voterAddress);

    /** @notice used to listen on workflow status changes
    *   @param _previousStatus the status before 
    *   @param _newStatus the status after */
    event WorkflowStatusChange(WorkflowStatus _previousStatus, WorkflowStatus _newStatus);

    /** @notice used to store the proposals registered
    *   @param _proposalId the ID of the new proposal */
    event ProposalRegistered(uint _proposalId);
    
    /** @notice used when a voter voter 
    *   @param _voter the address of the voter
    *   @param _proposalId the ID of the proposal voted */
    event Voted (address _voter, uint _proposalId);


    /** @notice verify if the sender address is registered as a voter */
    modifier onlyVoters() {
        require(voters[msg.sender].isRegistered, "You're not a voter/owner");
        _;
    }
    
    // ::::::::::::: GETTERS ::::::::::::: //

    /** @notice Returns the voter object of the given address
    *   @param _addr the address of the voter */
    function getVoter(address _addr) external view returns (Voter memory) {
        return voters[_addr];
    }

    /** @notice Returns the proposal object of the given ID
    *   @param _id the id of the proposal */
    function getOneProposal(uint _id) external view returns (Proposal memory) {
        return proposalsArray[_id];
    }

    /** @notice Returns the proposal array */
    function getProposals() external view returns (Proposal[] memory) {
        return proposalsArray;
    }

    /** @notice Returns the complete proposal  */
    function getWinner() external view returns (Proposal memory) {
        require(workflowStatus == WorkflowStatus.VotesTallied, 'Votes are not tallied yet');
        return proposalsArray[winningProposalID];
    }
 
    // ::::::::::::: REGISTRATION ::::::::::::: // 

    /** @notice Admin can register a voter 
    *   @param _addr the address of the voter */
    function addVoter(address _addr) public onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, 'Voters registration is not open yet');
        require(voters[_addr].isRegistered != true, 'Already registered');
    
        voters[_addr].isRegistered = true;
        emit VoterRegistered(_addr);
    }
 
    // ::::::::::::: PROPOSAL ::::::::::::: // 

    /** @notice Voter can register a new proposal
    *   @param _desc the description of the proposal */
    function addProposal(string memory _desc) external onlyVoters {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, 'Proposals are not allowed yet');
        require(keccak256(abi.encode(_desc)) != keccak256(abi.encode("")), 'Vous ne pouvez pas ne rien proposer'); 

        Proposal memory proposal;
        proposal.description = _desc;
        proposalsArray.push(proposal);
        emit ProposalRegistered(proposalsArray.length-1);
    }

    // ::::::::::::: VOTE ::::::::::::: //

    /** @notice Voter can set his vote on an existing proposal 
    *   @param _id the ID of the proposal */
    function setVote( uint _id) external onlyVoters {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, 'Voting session havent started yet');
        require(voters[msg.sender].hasVoted != true, 'You have already voted');
        require(_id <= proposalsArray.length, 'Proposal not found'); 

        voters[msg.sender].votedProposalId = _id;
        voters[msg.sender].hasVoted = true;
        proposalsArray[_id].voteCount++;

        emit Voted(msg.sender, _id);
    }

    // ::::::::::::: STATE ::::::::::::: //

    /** @notice next workflowstatus : 0 -> 1 */
    function startProposalsRegistering() external onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, 'Registering proposals cant be started now');
        workflowStatus = WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters, WorkflowStatus.ProposalsRegistrationStarted);
    }

    /** @notice next workflowstatus : 1 -> 2 */
    function endProposalsRegistering() external onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, 'Registering proposals havent started yet');
        workflowStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationStarted, WorkflowStatus.ProposalsRegistrationEnded);
    }

    /** @notice next workflowstatus : 2 -> 3 */
    function startVotingSession() external onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationEnded, 'Registering proposals phase is not finished');
        workflowStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationEnded, WorkflowStatus.VotingSessionStarted);
    }

    /** @notice next workflowstatus : 3 -> 4 */
    function endVotingSession() external onlyOwner {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, 'Voting session havent started yet');
        workflowStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionStarted, WorkflowStatus.VotingSessionEnded);
    }

    /** @notice compute the winner, then next workflowstatus : 4 -> 5 */
    function tallyVotes() external onlyOwner {
        require(workflowStatus == WorkflowStatus.VotingSessionEnded, "Current status is not voting session ended");
        uint _winningProposalId;
        for (uint256 p = 0; p < proposalsArray.length; p++) {
            if (proposalsArray[p].voteCount > proposalsArray[_winningProposalId].voteCount) {
                _winningProposalId = p;
            }
        }
        winningProposalID = _winningProposalId;

        workflowStatus = WorkflowStatus.VotesTallied;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied);
    }
}
// https://ipfs.io/ipfs/QmaMhuvE9zCqkD4SqH9mdg4gQKt1LgTAbokfEraH8DKVUh