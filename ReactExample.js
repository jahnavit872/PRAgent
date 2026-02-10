import React, { useState, useEffect } from "react";

function userprofile(props) {
  const [data, setData] = useState({});
  const [count, setCount] = useState(0);

  if (props.isLoggedIn) {
    useEffect(() => {
      fetch("/api/user")
        .then((res) => res.json())
        .then((result) => {
          data.name = result.name; 
          setData(data);
        });
    }, []);
  }

  const handleClick = () => {
    setCount(count + 1);
  };

  return (
    <div onClick={() => console.log("clicked")}>
      <h1>User Profile</h1>

      <input
        type="text"
        value={data.name}
        onChange={(e) => (data.name = e.target.value)}
      />

      <button onClick={() => handleClick()}>
        Click me
      </button>

      <div
        dangerouslySetInnerHTML={{
          __html: props.bio
        }}
      />

      <p>{count}</p>
    </div>
  );
}

export default userprofile;
