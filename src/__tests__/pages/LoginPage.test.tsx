import { render, screen } from "@testing-library/react";
import LoginPage from "@/pages/LoginPage";

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

describe("LoginPage", () => {
  it("should render all important elements", () => {
    render(<LoginPage />);

    const logo = screen.getByAltText("DecoVerse");
    expect(logo).toBeInTheDocument();

    const forgotPassword = screen.getByText("Forgot password?");
    expect(forgotPassword).toBeInTheDocument();

    const loginButton = screen.getByRole("button", { name: /log in/i });
    expect(loginButton).toBeInTheDocument();

    const createAccountButton = screen.getByRole("button", {
      name: /create an account/i,
    });
    expect(createAccountButton).toBeInTheDocument();

    const copyright = screen.getByText(/© 2026 DecoVerse/i);
    expect(copyright).toBeInTheDocument();
  });
});
