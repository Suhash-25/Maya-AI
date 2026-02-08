#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <algorithm>

// Function to convert string to lowercase for better matching
std::string toLower(std::string data) {
    std::transform(data.begin(), data.end(), data.begin(), ::tolower);
    return data;
}

// Basic Sentiment Analysis Logic
std::string analyzeSentiment(std::string query) {
    std::vector<std::string> positive = {"happy", "great", "cool", "love", "yes", "work", "finally"};
    std::vector<std::string> negative = {"error", "bad", "stop", "no", "fix", "stuck", "hard"};
    
    int score = 0;
    std::string lowerQuery = toLower(query);

    for (const auto& word : positive) {
        if (lowerQuery.find(word) != std::string::npos) score++;
    }
    for (const auto& word : negative) {
        if (lowerQuery.find(word) != std::string::npos) score--;
    }

    if (score > 0) return "User is feeling POSITIVE/EXCITED.";
    if (score < 0) return "User is feeling FRUSTRATED/STUCK.";
    return "User mood is NEUTRAL.";
}

int main(int argc, char* argv[]) {
    if (argc < 2) return 1;

    // Build query from arguments
    std::string query = "";
    for (int i = 1; i < argc; ++i) {
        query += argv[i];
        if (i < argc - 1) query += " ";
    }

    // 1. Keyword Search in knowledge.txt
    std::ifstream file("knowledge.txt");
    std::string line;
    std::string foundFact = "No specific local data found.";

    while (std::getline(file, line)) {
        if (line.empty() || line[0] == '#') continue;
        if (toLower(line).find(toLower(query)) != std::string::npos) {
            foundFact = line;
            break; 
        }
    }

    // 2. Perform Sentiment Analysis
    std::string sentiment = analyzeSentiment(query);

    // 3. Output combined data for Python to read
    // Format: [FACT] | [SENTIMENT]
    std::cout << foundFact << " | " << sentiment << std::endl;

    return 0;
}