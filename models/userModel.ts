import client from "../models/connect";

const readMember = () => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM "Member"';
    client.query(query, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res.rows);
      }
    });
  });
};

export default readMember;
