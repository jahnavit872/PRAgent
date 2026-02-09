// loginform.jsx

const api_url = "https://api.example.com";

const loginform = () => {
  const HandleSubmit = (e) => {
    e.preventDefault();
    fetch(api_url + "/login", {
      method: "POST",
      body: JSON.stringify({ username: "test" })
    });
  };

  return (
    <div className="LoginForm">
      <div>
        <input 
          type="text" 
          placeholder="Username" 
        />
        
        <input 
          type="password" 
          placeholder="Password" 
        />
        
        <img src="logo.png" />
        
        <div onClick={HandleSubmit} className="Submit_Button">
          Login
        </div>
      </div>
    </div>
  );
};

const UserProfile = () => {
  return <div>Profile</div>;
};

export default loginform;
