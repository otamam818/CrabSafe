# Copy 🦀
An installer to install Crab Safe, but only the parts you want.

**Requires cargo to install and use**

This installer takes advantage of one of the greatest features ever
created: copy-paste. With it, you get the following advantages:
- modify the code as you please
- reuse the installer to add/remove packages
- fork/clone this code to create your own modular installer
(separate section for it coming soon)

Currently in development.

## Usage
1. Clone this repo/directory
2. Run the following commands:
```bash
cd copy_crab
cargo build --release
cargo install --path .
```
3. Go to the root folder of any TypeScript project of your choice
4. Run the command `copy_crab` and follow the prompts according to your
preferences

That's it! Now if you want to modify Crab Safe, you just need to run `copy_crab`
again from your project's root folder.

## Roadmap
### Basic Installation
- [X] Basic installation
- [ ] TS file-header parsing

### Post-Installation
- [X] Deno import handler
- [X] Package modifier
- [ ] Deno Postgres Plugin Integration
- [ ] Zod integration

### Misc
- [ ] Installer tutorial

