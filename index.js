require("dotenv").config();
const pg = require("pg");
const client = new pg.Client(process.env.DATABASE_URL);
const express = require("express");
const app = express();

app.use(express.json());

app.get("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM flavors ORDER BY created_at DESC`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM flavors WHERE id=$1`;
    const response = await client.query(SQL, [req.params.id]);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

app.post("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `
    INSERT INTO flavors(name,is_favorite) VALUES($1,$2)  RETURNING *`;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.is_favorite,
    ]);
    res.status(201).send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `DELETE from flavors WHERE id=$1`;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

app.put("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `
    UPDATE flavors
    SET name=$1, is_favorite=$2, updated_at=now()
    WHERE id=$3 RETURNING *
    `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.is_favorite,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

const init = async () => {
  const port = process.env.PORT;
  await client.connect();
  let SQL = `
  DROP TABLE IF EXISTS flavors;
  CREATE TABLE flavors(
  id SERIAL PRIMARY KEY,
  name VARCHAR(30) NOT NULL,
  is_favorite BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
  );
  `;
  await client.query(SQL);
  console.log("table created");
  SQL = `
  INSERT INTO flavors(name) VALUES('Vanilla');
  INSERT INTO flavors(name) VALUES('Chocalate');
  INSERT INTO flavors(name) VALUES('Cookies and cream');
  INSERT INTO flavors(name) VALUES('Strawberry');
  INSERT INTO flavors(name,is_favorite) VALUES('Coffee', false);
  `;
  await client.query(SQL);
  console.log("data seeded");

  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
};
init();
