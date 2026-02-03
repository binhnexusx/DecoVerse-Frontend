import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Header } from "./Header";

describe("Header component", () => {
  it("renders title and welcome text", () => {
    render(<Header />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();

    expect(
      screen.getByText("Welcome back, phongtran3005!")
    ).toBeInTheDocument();
  });

  it("renders Premium button", () => {
    render(<Header />);

    const button = screen.getByRole("button", {
      name: /premium/i,
    });

    expect(button).toBeInTheDocument();
  });
});
