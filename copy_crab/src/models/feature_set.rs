use serde::{Serialize, Deserialize};
use super::Feature;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum FeatureSet {
    All,
    Core,
    CorePlus
}

impl FeatureSet {
    pub fn get_feature_list(&self) -> Vec<Feature> {
        use FeatureSet as FS;
        use Feature as F;

        match self {
            FS::All => F::get_all(),
            FS::Core => vec![
                F::Core,
            ],
            FS::CorePlus => vec![
                F::Core,
                F::Option,
                F::Result,
            ],
        }
    }
}
