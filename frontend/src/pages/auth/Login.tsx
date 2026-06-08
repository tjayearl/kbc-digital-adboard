export default function Login() {
  return (
    <main>
      <h1>KBC Digital Adboard</h1>
      <form>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
        />

        <button type="submit">Sign in</button>
      </form>
    </main>
  );
}
