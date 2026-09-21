import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Her testten sonra DOM'u temizle; RTL'in otomatik cleanup'ı globals kapalıyken çalışmaz.
afterEach(() => {
  cleanup();
});
