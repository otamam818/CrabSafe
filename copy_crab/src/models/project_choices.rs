use serde::{Serialize, Deserialize};
use super::*;
use crate::ts_file_data::*;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectChoices {
    pub runtime: Runtime,
    pub chosen_directory: String,
    pub feature_set: ChosenFeatures,
    pub modularity: Modularity
}

impl ProjectChoices {
    pub fn handle(self) -> anyhow::Result<()> {
        // Convert the feature set to the list of strings to use
        let relevant_files: Vec<(&str, String)> = self.feature_set
            .get_feature_list()
            .iter()
            .map(|feature| (feature.get_implementation(), feature.get_file_name().to_string()))
            .collect::<Vec<(&str, String)>>();

        let (dir_path, sep) = parse_path(&self.chosen_directory);
        match self.modularity {
            Modularity::SingleFile => {
                // We don't need the file names of the files so 🤷‍♀️
                let relevant_files: Vec<&str> = relevant_files
                    .iter()
                    .filter(|t| {
                        if self.runtime != Runtime::Deno && t.1 == "parsers.ts" {
                            return false;
                        }

                        true
                    })
                    .map(|t| t.0)
                    .collect();
                let fin_string = self.gen_single_filedata(relevant_files);

                let fin_file = format!("{dir_path}{sep}crabSafe.ts");
                std::fs::write(fin_file, fin_string)?;
            },
            Modularity::SplitFiles => {
                let fin_dir = format!("{dir_path}{sep}crabSafe");
                std::fs::create_dir(&fin_dir)?;
                for (file_content, file_name) in relevant_files {
                    let fin_file = format!("{fin_dir}{sep}{file_name}");
                    std::fs::write(fin_file, file_content)?
                }
            }
        }

        crate::settings_finder::save_settings(&self)?;
    
        Ok(())
    }

    fn gen_single_filedata(&self, relevant_files: Vec<&str>) -> String {
        let mut implementation_str = String::with_capacity(CORE_FUNCTIONS.len());
        let mut import_lines = Vec::new();
        for ts_file in relevant_files {
            let filtered: Vec<&str> = ts_file.split("\n")
                .filter(|line| {
                    if line.trim().starts_with("import") {
                        import_lines.push(line.to_string());
                        return false;
                    }
                    true
                })
                .collect();
            implementation_str.push_str(&filtered.join("\n"));
        }

        if self.runtime != Runtime::Deno {
            // Get rid of deno imports
            import_lines = filter_out(import_lines, "http");
        }

        // Remove local imports
        let import_lines = filter_out(import_lines, "\"./").join("\n");

        // Add new lines if meaningful
        let import_lines = if import_lines.trim().len() == 0 {
            format!("")
        } else {
            format!("{import_lines}\n\n")
        };

        format!("{import_lines}{}", implementation_str.trim())
    }
}

/// Filters out lines that contain the `exclude` string in the parameter
fn filter_out(lines: Vec<String>, exclude: &str) -> Vec<String> {
    lines.iter()
        .filter(|line| !line.contains(exclude))
        .map(|s| s.to_string())
        .collect()
}

fn parse_path(chosen_directory: &str) -> (&str, &str) {
    match chosen_directory.strip_suffix("/") {
        Some(rem_path) => (rem_path, "/"),
        None => match chosen_directory.strip_suffix("\\") {
            Some(rem_path) => (rem_path, "\\"),

            None => if chosen_directory.contains("/") {
                    (chosen_directory, "/")
                } else {
                    (chosen_directory, "\\")
                }
        }
    }
}
