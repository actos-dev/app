/**
 * Oturum bağlamı ve aksiyon kapısı testleri (Faz 5C / Birim 5C.2a, X-04).
 *
 * `useSession`, `useRequireAuth` ve `<RequireAuth>`: anonimde login'e
 * yönlendirme, oturumluda aksiyonu çalıştırma ve provider yokluğunda kapının
 * uygulanmaması doğrulanır.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  RequireAuth,
  SessionProvider,
  useRequireAuth,
  useSession,
} from "@/components/auth/SessionProvider";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  action: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}));

function Probe() {
  const session = useSession();
  const requireAuth = useRequireAuth();
  return (
    <>
      <span data-testid="state">
        {session ? (session.authenticated ? "in" : "out") : "none"}
      </span>
      <button type="button" onClick={() => requireAuth(() => mocks.action())}>
        run
      </button>
    </>
  );
}

beforeEach(() => {
  mocks.push.mockReset();
  mocks.replace.mockReset();
  mocks.action.mockReset();
});

describe("useSession", () => {
  it("provider yoksa null döner (kapı uygulanmaz)", () => {
    render(<Probe />);
    expect(screen.getByTestId("state")).toHaveTextContent("none");
  });
});

describe("useRequireAuth", () => {
  it("anonimde aksiyonu çalıştırmaz; /login?next= hedefine yönlendirir", async () => {
    const user = userEvent.setup();
    render(
      <SessionProvider session={{ authenticated: false }}>
        <Probe />
      </SessionProvider>,
    );

    expect(screen.getByTestId("state")).toHaveTextContent("out");
    await user.click(screen.getByRole("button", { name: "run" }));

    expect(mocks.action).not.toHaveBeenCalled();
    expect(mocks.push).toHaveBeenCalledWith(expect.stringContaining("/login?next="));
  });

  it("oturumluda aksiyonu çalıştırır, yönlendirmez", async () => {
    const user = userEvent.setup();
    render(
      <SessionProvider session={{ authenticated: true }}>
        <Probe />
      </SessionProvider>,
    );

    await user.click(screen.getByRole("button", { name: "run" }));

    expect(mocks.action).toHaveBeenCalledTimes(1);
    expect(mocks.push).not.toHaveBeenCalled();
  });
});

describe("RequireAuth", () => {
  it("anonimde fallback gösterir ve login'e yönlendirir", async () => {
    render(
      <SessionProvider session={{ authenticated: false }}>
        <RequireAuth fallback={<span>kilitli</span>}>
          <span>gizli içerik</span>
        </RequireAuth>
      </SessionProvider>,
    );

    expect(screen.getByText("kilitli")).toBeInTheDocument();
    expect(screen.queryByText("gizli içerik")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith(expect.stringContaining("/login?next="));
    });
  });

  it("oturumluda içeriği gösterir", () => {
    render(
      <SessionProvider session={{ authenticated: true }}>
        <RequireAuth>
          <span>gizli içerik</span>
        </RequireAuth>
      </SessionProvider>,
    );

    expect(screen.getByText("gizli içerik")).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
