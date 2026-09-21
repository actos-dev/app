import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FormField } from "../form-field";
import { Input } from "../input";

function Demo({ error }: { error?: string }) {
  return (
    <FormField label="E-posta" hint="Kayıt e-postan" error={error}>
      {(control) => <Input type="email" autoComplete="email" {...control} />}
    </FormField>
  );
}

describe("FormField + Input", () => {
  it("getByLabelText kontrolü bulur", () => {
    render(<Demo />);

    expect(screen.getByLabelText("E-posta")).toBeInstanceOf(HTMLInputElement);
  });

  it("hint'i aria-describedby ile bağlar", () => {
    render(<Demo />);
    const input = screen.getByLabelText("E-posta");
    const hint = screen.getByText("Kayıt e-postan");

    expect(input).toHaveAttribute("aria-describedby", hint.id);
  });

  it("hatayı role=alert ile duyurur ve bağlantıyı kurar", () => {
    render(<Demo error="Geçersiz e-posta" />);
    const input = screen.getByLabelText("E-posta");
    const alert = screen.getByRole("alert");

    expect(alert).toHaveTextContent("Geçersiz e-posta");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toContain(alert.id);
    expect(input.getAttribute("aria-describedby")).toContain(
      screen.getByText("Kayıt e-postan").id,
    );
  });
});
