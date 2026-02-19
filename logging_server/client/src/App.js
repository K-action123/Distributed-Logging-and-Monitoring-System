import React from "react";
import "./App.css";
import { DataTable } from "./DataTable";
import { StyledEngineProvider } from "@mui/material/styles";
import { baseSearch, login, register } from "./buttonActions";
import { Box, Button, TextField, Typography, Container, Paper } from "@mui/material";

function CustomTextField(props) {
  return (<TextField
    style={{ marginBottom: "10px" }}
    fullWidth
    label={props.label}
    variant={'outlined'}
    value={props.value}
    type={props.type || 'text'}
    onChange={(newValue) => {
      props.onChangeFunc(newValue.target.value)
    }}
  />);
}

function App() {
  const [data, setData] = React.useState([]);
  const [token, setToken] = React.useState(localStorage.getItem('token') || "");
  const [isRegistering, setIsRegistering] = React.useState(false);

  // Auth fields
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [teamName, setTeamName] = React.useState("");

  // Search fields
  const [messageSearch, setMessageSearch] = React.useState("");
  const [logLevelSearch, setLogLevelSearch] = React.useState("");
  const [requestIdSearch, setRequestIdSearch] = React.useState("");
  const [machineIdSearch, setMachineIdSearch] = React.useState("");

  const handleLogin = async () => {
    const res = await login(email, password);
    if (res.token) {
      setToken(res.token);
      localStorage.setItem('token', res.token);
    } else {
      alert(res.error || "Login failed");
    }
  };

  const handleRegister = async () => {
    const res = await register(email, password, teamName);
    if (res.userId) {
      alert("Registration successful! Please login.");
      setIsRegistering(false);
    } else {
      alert(res.error || "Registration failed");
    }
  };

  const handleLogout = () => {
    setToken("");
    localStorage.removeItem('token');
    setData([]);
  };

  const performSearch = async () => {
    let query = "?";
    if (messageSearch) query += `message=${messageSearch}&`;
    if (logLevelSearch) query += `level=${logLevelSearch}&`;
    if (requestIdSearch) query += `request_id=${requestIdSearch}&`;
    if (machineIdSearch) query += `machine_id=${machineIdSearch}`;

    try {
      const logs = await baseSearch(query, token);
      setData(logs);
    } catch (e) {
      if (e.message === 'Unauthorized') handleLogout();
    }
  };

  React.useEffect(() => {
    if (token) performSearch();
  }, [token]);

  if (!token) {
    return (
      <Container maxWidth="sm" style={{ marginTop: '100px' }}>
        <Paper elevation={3} style={{ padding: '40px', textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            {isRegistering ? "Create Team Account" : "Logging Portal Login"}
          </Typography>
          <CustomTextField label="Email" value={email} onChangeFunc={setEmail} />
          <CustomTextField label="Password" value={password} type="password" onChangeFunc={setPassword} />
          {isRegistering && (
            <CustomTextField label="Team Name" value={teamName} onChangeFunc={setTeamName} />
          )}
          <Button
            variant="contained"
            fullWidth
            color="primary"
            onClick={isRegistering ? handleRegister : handleLogin}
          >
            {isRegistering ? "Register" : "Login"}
          </Button>
          <Button
            fullWidth
            style={{ marginTop: '10px' }}
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering ? "Already have an account? Login" : "Need an account? Register"}
          </Button>
        </Paper>
      </Container>
    );
  }

  return (<div className="App">
    <header className="App-header">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '90%', mt: 2 }}>
        <Typography variant="h5">Distributed Logging Portal</Typography>
        <Button variant="outlined" color="secondary" onClick={handleLogout}>Logout</Button>
      </Box>
      <Box component="form" sx={{ '& > :not(style)': { m: 1, width: '25ch' }, mt: 4 }} noValidate autoComplete="off">
        <CustomTextField label="Message Search" value={messageSearch} onChangeFunc={setMessageSearch} />
        <CustomTextField label="Log Level" value={logLevelSearch} onChangeFunc={setLogLevelSearch} />
        <CustomTextField label="Request ID" value={requestIdSearch} onChangeFunc={setRequestIdSearch} />
        <CustomTextField label="Machine ID" value={machineIdSearch} onChangeFunc={setMachineIdSearch} />
      </Box>
      <Box sx={{ mb: 2 }}>
        <Button variant="contained" color="primary" sx={{ mr: 2 }} onClick={performSearch}>Search</Button>
        <Button variant="contained" color="primary" onClick={performSearch}>Refresh</Button>
      </Box>
      <StyledEngineProvider injectFirst>
        <DataTable rows={data} />
      </StyledEngineProvider>
    </header>
  </div>);
}

export default App;
