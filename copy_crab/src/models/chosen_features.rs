use serde::{Serialize, Deserialize};

use super::*;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum ChosenFeatures {
    Preset { preset_name: FeatureSet },
    Custom { features: Vec<Feature> }
}

impl ChosenFeatures {
    pub fn get_feature_list(&self) -> Vec<Feature> {
        match &self {
            ChosenFeatures::Custom { features } => features.clone(),
            ChosenFeatures::Preset { ref preset_name } => preset_name.get_feature_list()
        }
    }
}