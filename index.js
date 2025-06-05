module.exports.handler = async (event) => {
  // conecta base de datos
  const [first, setfirst] = useState(second)
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Desde github",
        input: event,
      },
      null,
      2
    ),
  };
};
