import React from "react";

const Row: React.FC<{ticker: string; name: string; mentions: number; time: number}> = (props) => {
  return (
    <React.Fragment>
      <tr>
        <td>{props.ticker}</td>
        <td>
          <a>{props.name}</a>
        </td>
        <td>
          {props.mentions}          
        </td>
        <td>
          24 hrs      
        </td>
      </tr>
      <tr className="spacer">
        <td colSpan={100}></td>
      </tr>
    </React.Fragment>
  );
};

export default Row;
