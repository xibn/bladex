export {};

const cmd = process.argv[2];

switch (cmd) {
  case "create":
    await import("../src/commands/create");
    break;
  case "build":
    await import("../src/commands/build");
    break;
  case "dev":
    await import("../src/commands/dev");
    break;
  default:
    console.log("bladex <create|build|dev>");
}
