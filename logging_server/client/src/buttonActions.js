import { createData } from "./DataTable";

const LOGS_BASE_URL = "http://localhost:8000/logs/search/"
const AUTH_BASE_URL = "http://localhost:8001/"

const baseSearch = async (query, token) => {
  return await fetch(LOGS_BASE_URL + query, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(async res => {
      if (res.status === 401) throw new Error('Unauthorized');
      return res.json();
    })
    .then(res => {
      let rows = [];
      res.map(x => {
        rows.unshift(createData(x.id, x.message, x.logLevel, x.timestamp, x.requestId, x.machineId));
      });
      console.log(rows)
      return rows
    })
    .catch(err => {
      console.log(err);
      return [];
    });
}

const login = async (email, password) => {
  return await fetch(AUTH_BASE_URL + "login", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }).then(res => res.json());
}

const register = async (email, password, teamName) => {
  return await fetch(AUTH_BASE_URL + "register", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, teamName })
  }).then(res => res.json());
}

export { baseSearch, login, register };

