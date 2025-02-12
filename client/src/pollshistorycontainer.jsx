import React, { useState, useEffect } from "react";
import PollsHistoryDisplay from "./pollshistorydisplay.jsx";
import * as ENV from "./env";

export default function PollsHistoryContainer(props) {
  const [polls, setPolls] = useState([]);
  useEffect(() => {
    fetch(ENV.API_URL + `/poll/list/${props.userId}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setPolls(data));
  }, []);
  const pollsDisplay = [];
  console.log("polls", polls);
  for (let i = 0; i < polls.length; i++) {
    const {
      method,
      question,
      creatorId,
      pollId,
      voteCount,
      responses,
      winner,
      active,
    } = polls[i];
    pollsDisplay.push(
      <PollsHistoryDisplay
        method={method}
        question={question}
        creatorId={creatorId}
        pollId={pollId}
        voteCount={voteCount}
        responses={responses}
        winner={winner}
        active={active}
      />
    );
  }
  console.log("pollsDisplay", pollsDisplay);

  return (
    <div id="pollsHistoryContainer">
      <center>
        <h1>Past Polls</h1>
      </center>
      {pollsDisplay}
    </div>
  );
}
