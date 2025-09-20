

export const createUser = async (params: Credentials) => {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    // Try to read the error body
    let errorMsg = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      console.log(data)
      errorMsg = data?.message || errorMsg;
    } catch(e) {
      console.log(e)
    }

    throw new Error(errorMsg);
  }

  return res.json(); // success
};
