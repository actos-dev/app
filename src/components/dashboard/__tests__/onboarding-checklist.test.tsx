/**
 * `OnboardingChecklist` testleri (Faz 5 / Birim 5B.4, U-13).
 *
 * Adımların veriye göre durumu, tümü bitince/kapatılınca gizlenmesi ve
 * `localStorage` yazımı doğrulanır. Bileşen ek istek açmaz; veri prop'tan gelir.
 */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  ONBOARDING_DISMISSED_KEY,
  OnboardingChecklist,
} from "@/components/dashboard/OnboardingChecklist";
import type { Profile } from "@/lib/profile/types";
import { renderWithIntl } from "@/test/test-utils";

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    username: "ada",
    email: "ada@example.com",
    user_type: "user",
    created_at: null,
    email_verified: false,
    avatar_id: null,
    credits: 10,
    ...overrides,
  };
}

function renderChecklist(props: {
  profile: Profile | null;
  favoritesCount?: number;
  portfoliosCount?: number;
}) {
  return renderWithIntl(
    <OnboardingChecklist
      profile={props.profile}
      favoritesCount={props.favoritesCount ?? 0}
      portfoliosCount={props.portfoliosCount ?? 0}
    />,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe("OnboardingChecklist", () => {
  it("doğrulanmamış kullanıcıda üç adımı CTA'larıyla gösterir", () => {
    renderChecklist({ profile: makeProfile() });

    expect(screen.getByText("E-postanı doğrula")).toBeInTheDocument();
    expect(screen.getByText("İlk hisseni takibe al")).toBeInTheDocument();
    expect(screen.getByText("İlk portföyünü oluştur")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Hesabıma git/ })).toHaveAttribute(
      "href",
      "/profile",
    );
    expect(screen.getByRole("link", { name: /Hisseleri keşfet/ })).toHaveAttribute(
      "href",
      "/markets",
    );
    expect(screen.getByRole("link", { name: /Portföyünü oluştur/ })).toHaveAttribute(
      "href",
      "/portfolio",
    );
    expect(screen.getByText("0/3 tamamlandı")).toBeInTheDocument();
  });

  it("tamamlanan adımları işaretler ve ilerlemeyi günceller", () => {
    renderChecklist({
      profile: makeProfile({ email_verified: true }),
      favoritesCount: 2,
    });

    expect(screen.getByText("E-posta doğrulandı")).toBeInTheDocument();
    expect(screen.getByText("Takip listen hazır")).toBeInTheDocument();
    expect(screen.queryByText("Hesabıma git")).not.toBeInTheDocument();
    expect(screen.getByText("2/3 tamamlandı")).toBeInTheDocument();
  });

  it("profil yoksa doğrulama adımını göstermez", () => {
    renderChecklist({ profile: null });

    expect(screen.queryByText("E-postanı doğrula")).not.toBeInTheDocument();
    expect(screen.getByText("0/2 tamamlandı")).toBeInTheDocument();
  });

  it("hepsi tamamlanınca gizlenir", () => {
    const { container } = renderChecklist({
      profile: makeProfile({ email_verified: true }),
      favoritesCount: 1,
      portfoliosCount: 1,
    });

    expect(container).toBeEmptyDOMElement();
  });

  it("kapatınca gizlenir ve localStorage'a yazar", async () => {
    const user = userEvent.setup();
    const { container } = renderChecklist({ profile: makeProfile() });

    await user.click(screen.getByRole("button", { name: "Kapat" }));

    expect(container).toBeEmptyDOMElement();
    expect(window.localStorage.getItem(ONBOARDING_DISMISSED_KEY)).toBe("1");
  });

  it("daha önce kapatıldıysa gizlenir", async () => {
    window.localStorage.setItem(ONBOARDING_DISMISSED_KEY, "1");
    const { container } = renderChecklist({ profile: makeProfile() });

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
