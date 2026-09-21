import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Button } from "../button";
import { Tooltip } from "../tooltip";

describe("Tooltip", () => {
  it("hover ile içerik görünür olur", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Portföyü yenile">
        <Button aria-label="Yenile">Y</Button>
      </Tooltip>,
    );

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    await user.hover(screen.getByRole("button", { name: "Yenile" }));

    expect(await screen.findByRole("tooltip")).toHaveTextContent("Portföyü yenile");
  });
});
