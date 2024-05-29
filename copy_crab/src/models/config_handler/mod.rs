use std::collections::HashSet;

use crate::ts_file_data;

use serde::{Serialize, Deserialize};

use strum::IntoEnumIterator;
use strum_macros::{EnumIter, EnumString};

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize, EnumIter, Eq, Hash, EnumString)]
pub enum Feature {
    Core,
    Example,
    Option,
    Result,
    Parsers
}

impl Feature {
    pub fn get_all() -> Vec<Self> {
        Self::iter().collect()
    }

    #[allow(unused)]
    /// Shows everything that's not included in `included`
    /// (aka complements of `included`)
    pub fn get_complements(included: &Vec<Self>) -> Vec<Self> {
        let mut fin_set: HashSet<Self> = Self::iter().collect();
        for feature in included {
            fin_set.remove(&feature);
        }

        fin_set.into_iter().collect()
    }

    pub fn get_file_name(&self) -> &str {
        use Feature as F;
        match self {
            F::Core => "core.ts",
            F::Example => "example.ts",
            F::Option => "option.ts",
            F::Result => "result.ts",
            F::Parsers => "parsers.ts",
        }
    }

    pub fn get_implementation(&self) -> &'static str {
        // Alias them for quick reading
        use Feature as F;
        use ts_file_data as ts;

        // Match accordingly
        match self {
            F::Core => ts::CORE_FUNCTIONS,
            F::Example => ts::EXAMPLE,
            F::Option => ts::OPTION,
            F::Result => ts::RESULT,
            F::Parsers => ts::PARSERS,
        }
    }
}
