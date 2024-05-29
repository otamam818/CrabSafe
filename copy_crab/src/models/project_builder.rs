use super::{Runtime, ProjectChoices, Modularity, ChosenFeatures};

#[derive(Default)]
pub struct ProjectBuilder {
    runtime: Option<Runtime>,
    chosen_directory: Option<String>,
    feature_set: Option<ChosenFeatures>,
    modularity: Option<Modularity>
}

impl ProjectBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn set_runtime(mut self, chosen_runtime: Runtime) -> Self {
        self.runtime = Some(chosen_runtime);
        self
    }

    pub fn set_chosen_dir(mut self, chosen_directory: String) -> Self {
        self.chosen_directory = Some(chosen_directory);
        self
    }

    pub fn set_feature_set(mut self, chosen_feature_set: ChosenFeatures) -> Self {
        self.feature_set = Some(chosen_feature_set);
        self
    }

    pub fn set_modularity(mut self, modularity: Modularity) -> Self {
        self.modularity = Some(modularity);
        self
    }

    pub fn build(self) -> ProjectChoices {
        let Some(runtime) = self.runtime else {
            panic!("Runtime not inserted");
        };

        let Some(chosen_directory) = self.chosen_directory else {
            panic!("Chosen directory not inserted");
        };

        let Some(feature_set) = self.feature_set else {
            panic!("Feature set not inserted");
        };

        let Some(modularity) = self.modularity else {
            panic!("File modularity set not chosen");
        };

        ProjectChoices { runtime, chosen_directory, feature_set, modularity }
    }
}