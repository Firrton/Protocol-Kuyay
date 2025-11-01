#![cfg_attr(not(feature = "export-abi"), no_main)]

#[cfg(feature = "export-abi")]
fn main() {
    stylus_sdk::abi::export::print_abi::<circle_simulator::CircleSimulator>(
        "MIT",
        "^0.8.24"
    );
}
