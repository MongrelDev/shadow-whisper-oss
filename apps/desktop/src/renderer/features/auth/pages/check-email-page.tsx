import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckEmailContainer } from "../containers/check-email-container";

function readEmailFromHash(): string {
  const queryString = window.location.hash.split("?")[1] ?? "";
  const params = new URLSearchParams(queryString);
  return params.get("email") ?? "";
}

export function CheckEmailPage(): React.ReactElement {
  const email = useMemo(readEmailFromHash, []);
  const navigate = useNavigate();

  const handleVerified = (verifiedEmail: string) => {
    navigate({
      to: "/auth/login",
      search: { email: verifiedEmail, verified: "success" },
    });
  };

  return <CheckEmailContainer email={email} onVerified={handleVerified} />;
}
