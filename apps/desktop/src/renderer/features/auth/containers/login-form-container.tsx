import { LoginForm } from "../components/login-form";
import { BrowserAuthContainer } from "./browser-auth-container";

export function LoginFormContainer(): React.ReactElement {
  return (
    <LoginForm>
      <BrowserAuthContainer />
    </LoginForm>
  );
}
