mod project_builder;
mod project_choices;
mod config_handler;
mod feature_set;
mod chosen_features;

use serde::{Serialize, Deserialize};

pub use project_builder::ProjectBuilder;
pub use project_choices::ProjectChoices;
pub use config_handler::Feature;
pub use feature_set::FeatureSet;
pub use chosen_features::ChosenFeatures;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum Runtime {
    Deno,
    NodeJs,
    ClientSide
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Modularity {
    SingleFile,
    SplitFiles
}
